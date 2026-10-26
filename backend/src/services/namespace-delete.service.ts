import { NAMESPACE_DELETE_ENABLED } from '@config';
import { apiServiceName } from '@/config/api-config';
import {
  AttachmentPurpose,
  Category,
  Config,
  ContactReason,
  CountResponse,
  DecisionOutcome,
  EmailIntegration,
  ExternalIdType,
  LabelClassification,
  Labels,
  MeasureType,
  NamespaceConfig,
  Phase,
  Role,
  StatementOutcome,
  Status,
} from '@/data-contracts/supportmanagement/data-contracts';
import { User } from '@/interfaces/users.interface';
import ApiService from '@/services/api.service';
import prisma from '@/utils/prisma';

/**
 * Removes a whole namespace from the supportmanagement gateway and the admin's feature flag
 * table. The gateway does not cascade: deleting only `namespace-config` leaves every metadata
 * kind, the label tree, phases, action configs and the email integration behind (confirmed
 * with the supportmanagement team), so everything is deleted explicitly, most dependent first.
 */

export const DELETE_SECTION_ORDER = [
  'emailIntegration',
  'actionConfigs',
  'phaseTransitions',
  'phases',
  'labels',
  'labelClassifications',
  'externalIdTypes',
  'statementOutcomes',
  'decisionOutcomes',
  'measureTypes',
  'attachmentPurposes',
  'contactReasons',
  'categories',
  'roles',
  'statuses',
  'namespaceConfig',
  'featureFlags',
] as const;

export type DeleteSection = (typeof DELETE_SECTION_ORDER)[number];

/** One thing to delete: `path` is appended to the gateway URL, `label` is what the user sees. */
export interface DeleteItem {
  path: string;
  label: string;
}

export type DeletePlan = Record<DeleteSection, DeleteItem[]>;

export interface DeleteInspection {
  /** Errands currently in the namespace. The delete refuses when this is above zero. */
  errandCount: number;
  plan: DeletePlan;
}

export interface DeleteStep {
  section: DeleteSection;
  status: 'done' | 'skipped' | 'failed' | 'not_run';
  deleted: string[];
  error?: string;
}

export interface ExecuteDeleteResult {
  steps: DeleteStep[];
  completed: boolean;
}

const METADATA_PATH: Partial<Record<DeleteSection, string>> = {
  statementOutcomes: 'metadata/statementoutcomes',
  decisionOutcomes: 'metadata/decisionoutcomes',
  measureTypes: 'metadata/measuretypes',
  attachmentPurposes: 'metadata/attachmentpurposes',
  contactReasons: 'metadata/contactreasons',
  categories: 'metadata/categories',
  roles: 'metadata/roles',
  statuses: 'metadata/statuses',
  externalIdTypes: 'metadata/external-id-types',
  labelClassifications: 'metadata/label-classifications',
  phases: 'metadata/phases',
  actionConfigs: 'namespace-config/action-config',
};

type Named = { id?: string; name?: string };

export class NamespaceDeleteService {
  private readonly SERVICE = apiServiceName('supportmanagement');

  constructor(
    private readonly api: ApiService,
    private readonly user: User,
    private readonly municipalityId: number,
  ) {}

  private url(namespace: string, path: string): string {
    return `${this.SERVICE}/${this.municipalityId}/${namespace}/${path}`;
  }

  /** GET that treats the gateway's 404 as "nothing there" (checked by status, see namespace-import.service.ts). */
  private async getOrNull<T>(namespace: string, path: string): Promise<T | null> {
    try {
      const res = await this.api.get<T>({ url: this.url(namespace, path) }, this.user);
      return res.data ?? null;
    } catch (error) {
      if ((error as { status?: number })?.status === 404) return null;
      throw error;
    }
  }

  private async getList<T>(namespace: string, path: string): Promise<T[]> {
    return (await this.getOrNull<T[]>(namespace, path)) ?? [];
  }

  private byId(path: string, items: Named[], labelOf: (item: Named) => string = item => item.name ?? item.id): DeleteItem[] {
    return items.filter(item => item.id).map(item => ({ path: `${path}/${item.id}`, label: labelOf(item) }));
  }

  /** Global switch: the backend env variable NAMESPACE_DELETE_ENABLED. */
  isDeleteEnabled(): boolean {
    return NAMESPACE_DELETE_ENABLED;
  }

  /** Null when the namespace does not exist. Otherwise everything a delete would remove. */
  async inspect(namespace: string): Promise<DeleteInspection | null> {
    const config = await this.getOrNull<NamespaceConfig>(namespace, 'namespace-config');
    if (!config) return null;

    const [
      count,
      email,
      actionConfigs,
      phases,
      labels,
      labelClassifications,
      externalIdTypes,
      statementOutcomes,
      decisionOutcomes,
      measureTypes,
      attachmentPurposes,
      contactReasons,
      categories,
      roles,
      statuses,
      featureFlags,
    ] = await Promise.all([
      this.getOrNull<CountResponse>(namespace, 'errands/count'),
      this.getOrNull<EmailIntegration>(namespace, 'email-integration-config'),
      this.getList<Config>(namespace, METADATA_PATH.actionConfigs),
      this.getList<Phase>(namespace, METADATA_PATH.phases),
      this.getOrNull<Labels>(namespace, 'metadata/labels'),
      this.getList<LabelClassification>(namespace, METADATA_PATH.labelClassifications),
      this.getList<ExternalIdType>(namespace, METADATA_PATH.externalIdTypes),
      this.getList<StatementOutcome>(namespace, METADATA_PATH.statementOutcomes),
      this.getList<DecisionOutcome>(namespace, METADATA_PATH.decisionOutcomes),
      this.getList<MeasureType>(namespace, METADATA_PATH.measureTypes),
      this.getList<AttachmentPurpose>(namespace, METADATA_PATH.attachmentPurposes),
      this.getList<ContactReason>(namespace, METADATA_PATH.contactReasons),
      this.getList<Category>(namespace, METADATA_PATH.categories),
      this.getList<Role>(namespace, METADATA_PATH.roles),
      this.getList<Status>(namespace, METADATA_PATH.statuses),
      prisma.featureFlags.findMany({ where: { municipalityId: this.municipalityId, namespace } }),
    ]);

    const phaseTransitions: DeleteItem[] = phases.flatMap(phase =>
      (phase.transitions ?? [])
        .filter(transition => transition.id && phase.id)
        .map(transition => ({
          path: `${METADATA_PATH.phases}/${phase.id}/transitions/${transition.id}`,
          label: `${phase.name} → ${transition.targetPhaseName ?? transition.targetPhaseId}`,
        })),
    );

    const plan: DeletePlan = {
      emailIntegration: email ? [{ path: 'email-integration-config', label: 'emailIntegration' }] : [],
      actionConfigs: this.byId(METADATA_PATH.actionConfigs, actionConfigs),
      phaseTransitions,
      phases: this.byId(METADATA_PATH.phases, phases),
      labels: labels?.labelStructure?.length ? [{ path: 'metadata/labels', label: `labels (${labels.labelStructure.length} rot)` }] : [],
      labelClassifications: labelClassifications
        .filter(item => item.classification)
        .map(item => ({ path: `${METADATA_PATH.labelClassifications}/${item.classification}`, label: item.classification })),
      externalIdTypes: this.byId(METADATA_PATH.externalIdTypes, externalIdTypes),
      statementOutcomes: this.byId(METADATA_PATH.statementOutcomes, statementOutcomes),
      decisionOutcomes: this.byId(METADATA_PATH.decisionOutcomes, decisionOutcomes),
      measureTypes: this.byId(METADATA_PATH.measureTypes, measureTypes),
      attachmentPurposes: this.byId(METADATA_PATH.attachmentPurposes, attachmentPurposes),
      contactReasons: this.byId(METADATA_PATH.contactReasons, contactReasons, item => (item as ContactReason).reason ?? item.id),
      categories: this.byId(METADATA_PATH.categories, categories),
      roles: this.byId(METADATA_PATH.roles, roles),
      statuses: this.byId(METADATA_PATH.statuses, statuses),
      namespaceConfig: [{ path: 'namespace-config', label: namespace }],
      featureFlags: featureFlags.map(flag => ({ path: String(flag.id), label: `${flag.application}::${flag.name}` })),
    };

    return { errandCount: count?.count ?? 0, plan };
  }

  /**
   * Deletes in DELETE_SECTION_ORDER, one item at a time, stopping at the first failure. What
   * was already deleted stays deleted; re-running `inspect` shows what is left.
   */
  async execute(namespace: string, plan: DeletePlan): Promise<ExecuteDeleteResult> {
    const steps: DeleteStep[] = [];
    let failed = false;

    for (const section of DELETE_SECTION_ORDER) {
      const items = plan[section] ?? [];
      const step: DeleteStep = { section, status: 'not_run', deleted: [] };
      steps.push(step);
      if (failed) continue;
      if (items.length === 0) {
        step.status = 'skipped';
        continue;
      }

      let current = section as string;
      try {
        if (section === 'featureFlags') {
          await prisma.featureFlags.deleteMany({ where: { municipalityId: this.municipalityId, namespace } });
          step.deleted.push(...items.map(item => item.label));
        } else {
          for (const item of items) {
            current = `${section}/${item.label}`;
            await this.api.delete({ url: this.url(namespace, item.path) }, this.user);
            step.deleted.push(item.label);
          }
        }
        step.status = 'done';
      } catch (error) {
        failed = true;
        step.status = 'failed';
        const message = error instanceof Error ? error.message : String(error);
        step.error = `${current}: ${message}`;
      }
    }

    return { steps, completed: !failed };
  }
}
