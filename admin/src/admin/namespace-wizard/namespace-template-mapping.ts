import { labelsForNewNamespace } from '@admin/label-editor';
import { type ResourceRow } from '@admin/resource-config';
import { defaultFieldValues } from '@admin/resource-form-values';
import { getResourceDefaults } from '@admin/use-resource-data';
import type { LabelNode } from '@interfaces/label';
import { emailIntegrationWizardFields, WIZARD_METADATA_FIELD_KEYS } from './namespace-wizard-fields';
import type {
  EmailIntegrationDraft,
  FormValues,
  MetadataResourceName,
  MetadataRow,
  NamespaceTemplate,
} from './namespace-wizard-types';

/**
 * Turns records read from an existing namespace into wizard draft values. Only the
 * editable keys are picked, so ids, timestamps and the source namespace never carry over.
 */

/** Settings worth reusing; namespace, display name and short code are always new. */
const COPIED_NAMESPACE_KEYS = ['notificationTTLInDays', 'accessControl', 'notifyReporter'];

export function metadataRowsFromTemplate(
  resourceName: MetadataResourceName,
  rows: Record<string, unknown>[]
): MetadataRow[] {
  return rows
    .filter((row) => row.deprecated !== true)
    .map((row) =>
      Object.fromEntries(
        WIZARD_METADATA_FIELD_KEYS[resourceName].map((key) => [key, typeof row[key] === 'string' ? row[key] : ''])
      )
    );
}

export function namespaceConfigFromTemplate(record: Record<string, unknown> | undefined): FormValues {
  if (!record) return {};
  return Object.fromEntries(
    COPIED_NAMESPACE_KEYS.filter((key) => record[key] != null).map((key) => [key, record[key]])
  );
}

export function emptyEmailIntegrationDraft(statuses: MetadataRow[]): EmailIntegrationDraft {
  const fields = emailIntegrationWizardFields(statuses, []);
  const values = defaultFieldValues(fields, undefined, getResourceDefaults('emailIntegration'));
  const hasNewStatus = statuses.some((status) => status.name === 'NEW');
  return { configure: false, values: { ...values, statusForNew: hasNewStatus ? 'NEW' : '' } };
}

/**
 * The source's email integration, always switched off: senders and templates usually
 * need changing for the new namespace, so it is turned on deliberately afterwards.
 */
export function emailIntegrationFromTemplate(
  record: ResourceRow | undefined,
  statuses: MetadataRow[]
): EmailIntegrationDraft {
  if (!record) return emptyEmailIntegrationDraft(statuses);
  const fields = emailIntegrationWizardFields(statuses, []);
  const values = defaultFieldValues(fields, record, getResourceDefaults('emailIntegration'));
  const withoutNulls = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value ?? '']));
  return { configure: true, values: { ...withoutNulls, enabled: false } };
}

export function namespaceTemplateFromRecords(records: {
  namespace?: Record<string, unknown>;
  statuses?: Record<string, unknown>[];
  roles?: Record<string, unknown>[];
  contactReasons?: Record<string, unknown>[];
  labels?: LabelNode[];
  emailIntegration?: ResourceRow;
}): NamespaceTemplate {
  const statuses = metadataRowsFromTemplate('statuses', records.statuses ?? []);
  return {
    namespaceConfig: namespaceConfigFromTemplate(records.namespace),
    statuses,
    roles: metadataRowsFromTemplate('roles', records.roles ?? []),
    contactReasons: metadataRowsFromTemplate('contactReasons', records.contactReasons ?? []),
    labels: labelsForNewNamespace(records.labels ?? []),
    emailIntegration: emailIntegrationFromTemplate(records.emailIntegration, statuses),
  };
}
