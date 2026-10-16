import { apiServiceName } from '@/config/api-config';
import {
  AttachmentPurpose,
  Category,
  ContactReason,
  DecisionOutcome,
  EmailIntegration,
  Label,
  Labels,
  MeasureType,
  NamespaceConfig,
  Role,
  StatementOutcome,
  Status,
} from '@/data-contracts/supportmanagement/data-contracts';
import { NamespaceExportDto, NamespaceImportDto } from '@/dtos/namespace-import.dto';
import { User } from '@/interfaces/users.interface';
import { ImportStepResult } from '@/responses/namespace-import.response';
import ApiService from '@/services/api.service';
import { RawNamespaceData, toExportDocument } from '@/utils/namespace-export-mapper';
import { ExistingState, ImportPlanEntry, ImportSection, SECTION_ORDER, featureFlagKey } from '@/utils/namespace-import-validation';
import prisma from '@/utils/prisma';

/**
 * Reads and writes a whole namespace against the supportmanagement gateway and the admin's
 * feature flag table. The gateway bodies here are twins of what the per-kind controllers
 * send (statuses.controller.ts, categories.controller.ts, email-integration.controller.ts,
 * labels.controller.ts ...); keep them aligned when a controller changes.
 */

type MetadataKind =
  | 'statuses'
  | 'roles'
  | 'categories'
  | 'contactreasons'
  | 'attachmentpurposes'
  | 'measuretypes'
  | 'decisionoutcomes'
  | 'statementoutcomes';

const KIND_PATH: Record<Exclude<ImportSection, 'namespaceConfig' | 'labels' | 'emailIntegration' | 'featureFlags'>, MetadataKind> = {
  statuses: 'statuses',
  roles: 'roles',
  categories: 'categories',
  contactReasons: 'contactreasons',
  attachmentPurposes: 'attachmentpurposes',
  measureTypes: 'measuretypes',
  decisionOutcomes: 'decisionoutcomes',
  statementOutcomes: 'statementoutcomes',
};

export interface ExecuteImportResult {
  steps: ImportStepResult[];
  completed: boolean;
}

export class NamespaceImportService {
  private readonly SERVICE = apiServiceName('supportmanagement');

  constructor(
    private readonly api: ApiService,
    private readonly user: User,
    private readonly municipalityId: number,
  ) {}

  private configUrl(namespace: string): string {
    return `${this.SERVICE}/${this.municipalityId}/${namespace}/namespace-config`;
  }

  private metadataUrl(namespace: string, kind: MetadataKind | 'labels'): string {
    return `${this.SERVICE}/${this.municipalityId}/${namespace}/metadata/${kind}`;
  }

  private emailUrl(namespace: string): string {
    return `${this.SERVICE}/${this.municipalityId}/${namespace}/email-integration-config`;
  }

  /**
   * GET that treats the gateway's 404 as "nothing there". Checked by status, not
   * instanceof: HttpException's base class resets the prototype, so instanceof never matches.
   */
  private async getOrNull<T>(url: string): Promise<T | null> {
    try {
      const res = await this.api.get<T>({ url }, this.user);
      return res.data ?? null;
    } catch (error) {
      if ((error as { status?: number })?.status === 404) return null;
      throw error;
    }
  }

  private async getList<T>(url: string): Promise<T[]> {
    return (await this.getOrNull<T[]>(url)) ?? [];
  }

  // ---------------------------------------------------------------------------
  // Reading
  // ---------------------------------------------------------------------------

  async namespaceExists(namespace: string): Promise<boolean> {
    return (await this.getOrNull<NamespaceConfig>(this.configUrl(namespace))) !== null;
  }

  private async readRaw(namespace: string): Promise<RawNamespaceData | null> {
    const config = await this.getOrNull<NamespaceConfig>(this.configUrl(namespace));
    if (!config) return null;

    const [
      statuses,
      roles,
      categories,
      contactReasons,
      attachmentPurposes,
      measureTypes,
      decisionOutcomes,
      statementOutcomes,
      labels,
      emailIntegration,
      featureFlags,
    ] = await Promise.all([
      this.getList<Status>(this.metadataUrl(namespace, 'statuses')),
      this.getList<Role>(this.metadataUrl(namespace, 'roles')),
      this.getList<Category>(this.metadataUrl(namespace, 'categories')),
      this.getList<ContactReason>(this.metadataUrl(namespace, 'contactreasons')),
      this.getList<AttachmentPurpose>(this.metadataUrl(namespace, 'attachmentpurposes')),
      this.getList<MeasureType>(this.metadataUrl(namespace, 'measuretypes')),
      this.getList<DecisionOutcome>(this.metadataUrl(namespace, 'decisionoutcomes')),
      this.getList<StatementOutcome>(this.metadataUrl(namespace, 'statementoutcomes')),
      this.getOrNull<Labels>(this.metadataUrl(namespace, 'labels')).then(res => res?.labelStructure ?? []),
      this.getOrNull<EmailIntegration>(this.emailUrl(namespace)),
      prisma.featureFlags.findMany({ where: { municipalityId: this.municipalityId, namespace } }),
    ]);

    return {
      config,
      statuses,
      roles,
      categories,
      contactReasons,
      attachmentPurposes,
      measureTypes,
      decisionOutcomes,
      statementOutcomes,
      labels,
      emailIntegration,
      featureFlags,
    };
  }

  /** Null when the namespace does not exist. */
  async fetchExistingState(namespace: string): Promise<ExistingState | null> {
    const raw = await this.readRaw(namespace);
    if (!raw) return null;
    const names = (items: { name?: string }[]) => new Set(items.map(item => item.name).filter((name): name is string => !!name));
    return {
      statuses: names(raw.statuses),
      roles: names(raw.roles),
      categories: names(raw.categories),
      contactReasons: new Set(raw.contactReasons.map(reason => reason.reason).filter((reason): reason is string => !!reason)),
      attachmentPurposes: names(raw.attachmentPurposes),
      measureTypes: names(raw.measureTypes),
      decisionOutcomes: names(raw.decisionOutcomes),
      statementOutcomes: names(raw.statementOutcomes),
      hasLabels: raw.labels.length > 0,
      hasEmailIntegration: raw.emailIntegration !== null,
      featureFlags: new Set(raw.featureFlags.map(featureFlagKey)),
    };
  }

  /** The full document for an existing namespace, or null when it does not exist. */
  async exportNamespace(namespace: string): Promise<NamespaceExportDto | null> {
    const raw = await this.readRaw(namespace);
    return raw ? toExportDocument(namespace, raw) : null;
  }

  // ---------------------------------------------------------------------------
  // Writing
  // ---------------------------------------------------------------------------

  private async createNamespaceConfig(doc: NamespaceImportDto): Promise<void> {
    // Twin of namespace.controller.ts createNamespace: only these five fields are sent.
    const body: NamespaceConfig = {
      displayName: doc.config.displayName,
      shortCode: doc.config.shortCode,
      notificationTTLInDays: doc.config.notificationTTLInDays,
      accessControl: doc.config.accessControl,
      notifyReporter: doc.config.notifyReporter,
    };
    await this.api.post<NamespaceConfig>({ url: this.configUrl(doc.namespace), data: body }, this.user);
  }

  /** Gateway body for one item of a list section, mirroring the per-kind controllers. */
  private gatewayBody(section: keyof typeof KIND_PATH, item: NamespaceImportDto[keyof typeof KIND_PATH][number]): unknown {
    switch (section) {
      case 'statuses': {
        const status = item as Status;
        return { name: status.name, displayName: status.displayName, externalDisplayName: status.externalDisplayName } satisfies Status;
      }
      case 'roles': {
        const role = item as Role;
        return { name: role.name, displayName: role.displayName } satisfies Role;
      }
      case 'categories': {
        const category = item as Category;
        return {
          name: category.name,
          displayName: category.displayName,
          sortOrder: category.sortOrder,
          types: category.types ?? [],
        } satisfies Category;
      }
      case 'contactReasons': {
        const reason = item as ContactReason;
        return { reason: reason.reason, displayName: reason.displayName } satisfies ContactReason;
      }
      case 'measureTypes': {
        const measureType = item as MeasureType;
        return {
          name: measureType.name,
          displayName: measureType.displayName,
          measureGroups: measureType.measureGroups,
          sortOrder: measureType.sortOrder,
          deprecated: measureType.deprecated ?? false,
        } satisfies MeasureType;
      }
      case 'statementOutcomes': {
        const outcome = item as StatementOutcome;
        return {
          name: outcome.name,
          displayName: outcome.displayName,
          sortOrder: outcome.sortOrder,
          responded: outcome.responded ?? true,
          deprecated: outcome.deprecated ?? false,
        } satisfies StatementOutcome;
      }
      case 'attachmentPurposes':
      case 'decisionOutcomes': {
        const outcome = item as DecisionOutcome;
        return {
          name: outcome.name,
          displayName: outcome.displayName,
          sortOrder: outcome.sortOrder,
          deprecated: outcome.deprecated ?? false,
        } satisfies DecisionOutcome;
      }
    }
  }

  private async createLabels(doc: NamespaceImportDto): Promise<void> {
    // Twin of labels.controller.ts createLabels: the gateway takes the bare array.
    await this.api.post<void>({ url: this.metadataUrl(doc.namespace, 'labels'), data: doc.labels as Label[] }, this.user);
  }

  private async putEmailIntegration(doc: NamespaceImportDto): Promise<void> {
    const email = doc.emailIntegration;
    // Twin of email-integration.controller.ts updateEmailIntegration: the contract types
    // these two as string|null, so number/boolean are serialised before sending.
    const body: EmailIntegration = {
      enabled: email.enabled,
      errandClosedEmailSender: email.errandClosedEmailSender,
      errandClosedEmailTemplate: email.errandClosedEmailTemplate,
      errandClosedEmailHTMLTemplate: email.errandClosedEmailHTMLTemplate,
      errandNewEmailSender: email.errandNewEmailSender,
      errandNewEmailTemplate: email.errandNewEmailTemplate,
      errandNewEmailHTMLTemplate: email.errandNewEmailHTMLTemplate,
      daysOfInactivityBeforeReject: email.daysOfInactivityBeforeReject?.toString(),
      statusForNew: email.statusForNew,
      triggerStatusChangeOn: email.triggerStatusChangeOn,
      statusChangeTo: email.statusChangeTo,
      inactiveStatus: email.inactiveStatus,
      addSenderAsStakeholder: email.addSenderAsStakeholder?.toString(),
      stakeholderRole: email.stakeholderRole,
      errandChannel: email.errandChannel,
      ignoreAutoReply: email.ignoreAutoReply,
      ignoreNoReply: email.ignoreNoReply,
    };
    await this.api.put<EmailIntegration>({ url: this.emailUrl(doc.namespace), data: body }, this.user);
  }

  private async createFeatureFlags(doc: NamespaceImportDto, skipped: Set<string>): Promise<string[]> {
    const toCreate = (doc.featureFlags ?? []).filter(flag => !skipped.has(featureFlagKey(flag)));
    if (toCreate.length === 0) return [];
    await prisma.$transaction(
      toCreate.map(flag =>
        prisma.featureFlags.create({
          data: {
            name: flag.name,
            description: flag.description,
            enabled: flag.enabled,
            application: flag.application,
            namespace: doc.namespace,
            municipalityId: this.municipalityId,
          },
        }),
      ),
    );
    return toCreate.map(featureFlagKey);
  }

  /**
   * Applies the plan in SECTION_ORDER, one item at a time. Stops at the first failure and
   * marks the remaining sections not_run; there is no rollback (the gateway has none), so
   * the caller re-runs with allowExisting to resume.
   */
  async executeImport(doc: NamespaceImportDto, plan: ImportPlanEntry[]): Promise<ExecuteImportResult> {
    const planFor = (section: ImportSection): ImportPlanEntry =>
      plan.find(entry => entry.section === section) ?? { section, create: 0, skip: 0, skipped: [] };
    const steps: ImportStepResult[] = [];
    let failed = false;

    for (const section of SECTION_ORDER) {
      const entry = planFor(section);
      const step: ImportStepResult = { section, status: 'not_run', created: [], skipped: [...entry.skipped] };
      steps.push(step);
      if (failed) continue;
      if (entry.create === 0) {
        step.status = 'skipped';
        continue;
      }

      let current: string = section;
      try {
        switch (section) {
          case 'namespaceConfig':
            await this.createNamespaceConfig(doc);
            step.created.push(doc.namespace);
            break;
          case 'labels':
            await this.createLabels(doc);
            step.created.push('labels');
            break;
          case 'emailIntegration':
            await this.putEmailIntegration(doc);
            step.created.push('emailIntegration');
            break;
          case 'featureFlags':
            step.created.push(...(await this.createFeatureFlags(doc, new Set(entry.skipped))));
            break;
          default: {
            const skipped = new Set(entry.skipped);
            const url = this.metadataUrl(doc.namespace, KIND_PATH[section]);
            for (const item of doc[section] ?? []) {
              const keyed = item as { name?: string; reason?: string };
              const key = (section === 'contactReasons' ? keyed.reason : keyed.name) ?? '';
              if (skipped.has(key)) continue;
              current = `${section}/${key}`;
              await this.api.post({ url, data: this.gatewayBody(section, item) }, this.user);
              step.created.push(key);
            }
          }
        }
        step.status = 'done';
      } catch (error) {
        failed = true;
        step.status = 'failed';
        const message = error instanceof Error ? error.message : String(error);
        step.error = current === section ? message : `${current}: ${message}`;
      }
    }

    return { steps, completed: !failed };
  }
}
