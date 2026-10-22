import { type FieldDef, getResourceConfig } from '@admin/resource-config';
import { getResourceRequiredFields } from '@admin/use-resource-data';
import type { MetadataResourceName, MetadataRow } from './namespace-wizard-types';

/**
 * FieldDefs for the wizard, picked from the resource registry so labels, help
 * texts and required flags stay the same as on the regular edit pages.
 */

export const WIZARD_METADATA_FIELD_KEYS: Record<MetadataResourceName, string[]> = {
  statuses: ['name', 'displayName', 'externalDisplayName'],
  roles: ['name', 'displayName'],
  contactReasons: ['reason', 'displayName'],
};

export const METADATA_ITEM_LABELS: Record<MetadataResourceName, { singular: string; plural: string }> = {
  statuses: { singular: 'Status', plural: 'Statusar' },
  roles: { singular: 'Roll', plural: 'Roller' },
  contactReasons: { singular: 'Kontaktorsak', plural: 'Kontaktorsaker' },
};

/** Status keys of the email integration; each holds a status name from the wizard's statuses. */
export const EMAIL_STATUS_FIELD_KEYS = ['statusForNew', 'triggerStatusChangeOn', 'statusChangeTo', 'inactiveStatus'];

const fieldsOf = (resourceName: string): FieldDef[] => getResourceConfig(resourceName)?.fields ?? [];

export function metadataFields(resourceName: MetadataResourceName): FieldDef[] {
  const fields = fieldsOf(resourceName);
  return WIZARD_METADATA_FIELD_KEYS[resourceName].flatMap((key) => fields.filter((field) => field.key === key));
}

/** The field that identifies a row (name, or reason for contact reasons). */
export const metadataKeyField = (resourceName: MetadataResourceName): string =>
  WIZARD_METADATA_FIELD_KEYS[resourceName][0];

export function requiredMetadataKeys(resourceName: MetadataResourceName): string[] {
  const required = new Set(getResourceRequiredFields(resourceName));
  return metadataFields(resourceName)
    .filter((field) => field.required || required.has(field.key))
    .map((field) => field.key);
}

export const emptyMetadataRow = (resourceName: MetadataResourceName): MetadataRow =>
  Object.fromEntries(WIZARD_METADATA_FIELD_KEYS[resourceName].map((key) => [key, '']));

export const namespaceConfigFields = (): FieldDef[] => fieldsOf('namespaces');

/** Select options for statuses or roles, labelled like the namespace options: "Visningsnamn (NAMN)". */
export function metadataOptions(rows: MetadataRow[], keyField = 'name'): { value: string; label: string }[] {
  return rows
    .map((row) => ({ name: row[keyField]?.trim() ?? '', displayName: row.displayName?.trim() ?? '' }))
    .filter(({ name }) => name !== '')
    .map(({ name, displayName }) => ({ value: name, label: displayName ? `${displayName} (${name})` : name }));
}

/**
 * The email integration fields without namespace, with the status selects and the
 * stakeholder role fed from the wizard's own statuses and roles.
 */
export function emailIntegrationWizardFields(statuses: MetadataRow[], roles: MetadataRow[]): FieldDef[] {
  const statusOptions = metadataOptions(statuses);
  const roleOptions = metadataOptions(roles);
  return fieldsOf('emailIntegration')
    .filter((field) => field.key !== 'namespace')
    .map((field) => {
      if (EMAIL_STATUS_FIELD_KEYS.includes(field.key)) return { ...field, options: statusOptions };
      if (field.key === 'stakeholderRole') return { ...field, type: 'select', options: roleOptions };
      return field;
    });
}
