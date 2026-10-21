import {
  AttachmentPurpose,
  Category,
  ContactReason,
  DecisionOutcome,
  EmailIntegration,
  Label,
  MeasureType,
  NamespaceConfig,
  Role,
  StatementOutcome,
  Status,
} from '@/data-contracts/supportmanagement/data-contracts';
import {
  AttachmentPurposeImportDto,
  CategoryImportDto,
  ContactReasonImportDto,
  DecisionOutcomeImportDto,
  EmailIntegrationImportDto,
  FeatureFlagImportDto,
  LabelImportDto,
  MeasureTypeImportDto,
  NAMESPACE_IMPORT_FORMAT_VERSION,
  NamespaceExportDto,
  RoleImportDto,
  StatementOutcomeImportDto,
  StatusImportDto,
} from '@/dtos/namespace-import.dto';
import { FeatureFlags } from '@prisma/client';

/**
 * Turns what the gateway and Prisma return into the import document: ids, timestamps,
 * versions and derived fields are dropped so the output can be fed straight back into
 * `POST /namespaces/:municipalityId/import`.
 */

export interface RawNamespaceData {
  config: NamespaceConfig;
  statuses: Status[];
  roles: Role[];
  categories: Category[];
  contactReasons: ContactReason[];
  attachmentPurposes: AttachmentPurpose[];
  measureTypes: MeasureType[];
  decisionOutcomes: DecisionOutcome[];
  statementOutcomes: StatementOutcome[];
  labels: Label[];
  /** null when the gateway has no email integration for the namespace. */
  emailIntegration: EmailIntegration | null;
  featureFlags: FeatureFlags[];
}

/** Drop keys whose value is null or undefined, so optional fields are omitted rather than nulled. */
function compact<T extends object>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined && value !== null)) as T;
}

export const statusToExport = (status: Status): StatusImportDto =>
  compact({
    name: status.name,
    displayName: status.displayName,
    externalDisplayName: status.externalDisplayName,
    sortOrder: status.sortOrder,
    deprecated: status.deprecated,
  });

export const roleToExport = (role: Role): RoleImportDto =>
  compact({ name: role.name, displayName: role.displayName ?? role.name, sortOrder: role.sortOrder, deprecated: role.deprecated });

export const categoryToExport = (category: Category): CategoryImportDto =>
  compact({
    name: category.name,
    displayName: category.displayName,
    sortOrder: category.sortOrder,
    deprecated: category.deprecated,
    types: (category.types ?? []).map(type =>
      compact({ name: type.name, displayName: type.displayName, escalationEmail: type.escalationEmail, deprecated: type.deprecated }),
    ),
  });

export const contactReasonToExport = (reason: ContactReason): ContactReasonImportDto =>
  compact({ reason: reason.reason, displayName: reason.displayName, sortOrder: reason.sortOrder, deprecated: reason.deprecated });

export const attachmentPurposeToExport = (purpose: AttachmentPurpose): AttachmentPurposeImportDto =>
  compact({ name: purpose.name, displayName: purpose.displayName, sortOrder: purpose.sortOrder, deprecated: purpose.deprecated });

export const measureTypeToExport = (measureType: MeasureType): MeasureTypeImportDto =>
  compact({
    name: measureType.name,
    displayName: measureType.displayName,
    measureGroups: measureType.measureGroups ?? [],
    sortOrder: measureType.sortOrder,
    deprecated: measureType.deprecated,
  });

export const decisionOutcomeToExport = (outcome: DecisionOutcome): DecisionOutcomeImportDto =>
  compact({ name: outcome.name, displayName: outcome.displayName, sortOrder: outcome.sortOrder, deprecated: outcome.deprecated });

export const statementOutcomeToExport = (outcome: StatementOutcome): StatementOutcomeImportDto =>
  compact({
    name: outcome.name,
    displayName: outcome.displayName,
    sortOrder: outcome.sortOrder,
    responded: outcome.responded,
    deprecated: outcome.deprecated,
  });

/** Recursive: drops id, version, resourcePath and classificationDisplayName. */
export const labelToExport = (label: Label): LabelImportDto =>
  compact({
    classification: label.classification,
    resourceName: label.resourceName,
    displayName: label.displayName,
    deprecated: label.deprecated,
    labels: label.labels?.length ? label.labels.map(labelToExport) : undefined,
    attributes: label.attributes?.length ? label.attributes.map(attribute => ({ key: attribute.key, value: attribute.value })) : undefined,
  });

/** Same string -> number/boolean conversions as mapEmailIntegration in email-integration.controller.ts. */
export const emailIntegrationToExport = (data: EmailIntegration): EmailIntegrationImportDto => {
  const days = data.daysOfInactivityBeforeReject;
  const stakeholder = data.addSenderAsStakeholder;
  return compact({
    enabled: data.enabled,
    errandClosedEmailSender: data.errandClosedEmailSender,
    errandClosedEmailTemplate: data.errandClosedEmailTemplate,
    errandClosedEmailHTMLTemplate: data.errandClosedEmailHTMLTemplate,
    errandNewEmailSender: data.errandNewEmailSender,
    errandNewEmailTemplate: data.errandNewEmailTemplate,
    errandNewEmailHTMLTemplate: data.errandNewEmailHTMLTemplate,
    daysOfInactivityBeforeReject: typeof days === 'string' ? (days === '' ? undefined : parseInt(days, 10)) : days,
    statusForNew: data.statusForNew,
    triggerStatusChangeOn: data.triggerStatusChangeOn,
    statusChangeTo: data.statusChangeTo,
    inactiveStatus: data.inactiveStatus,
    addSenderAsStakeholder: typeof stakeholder === 'string' ? stakeholder === 'true' : stakeholder,
    stakeholderRole: data.stakeholderRole,
    errandChannel: data.errandChannel,
    ignoreAutoReply: data.ignoreAutoReply,
    ignoreNoReply: data.ignoreNoReply,
  });
};

export const featureFlagToExport = (flag: FeatureFlags): FeatureFlagImportDto => ({
  name: flag.name,
  description: flag.description ?? '',
  enabled: flag.enabled,
  application: flag.application,
});

export function toExportDocument(namespace: string, raw: RawNamespaceData, exportedAt = new Date()): NamespaceExportDto {
  const doc: NamespaceExportDto = {
    formatVersion: NAMESPACE_IMPORT_FORMAT_VERSION,
    exportedAt: exportedAt.toISOString(),
    namespace,
    config: compact({
      displayName: raw.config.displayName,
      shortCode: raw.config.shortCode,
      notificationTTLInDays: raw.config.notificationTTLInDays,
      accessControl: raw.config.accessControl,
      notifyReporter: raw.config.notifyReporter,
    }),
    statuses: raw.statuses.map(statusToExport),
    roles: raw.roles.map(roleToExport),
    categories: raw.categories.map(categoryToExport),
    contactReasons: raw.contactReasons.map(contactReasonToExport),
    attachmentPurposes: raw.attachmentPurposes.map(attachmentPurposeToExport),
    measureTypes: raw.measureTypes.map(measureTypeToExport),
    decisionOutcomes: raw.decisionOutcomes.map(decisionOutcomeToExport),
    statementOutcomes: raw.statementOutcomes.map(statementOutcomeToExport),
    labels: raw.labels.map(labelToExport),
    featureFlags: raw.featureFlags.map(featureFlagToExport),
  };
  if (raw.emailIntegration) {
    doc.emailIntegration = emailIntegrationToExport(raw.emailIntegration);
  }
  return doc;
}
