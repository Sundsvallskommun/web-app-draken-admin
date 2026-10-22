import { getResourceConfig } from '@admin/resource-config';
import type { LabelNode } from '@interfaces/label';
import { isValidEmail } from '@utils/email';
import type { FieldErrors, Resolver } from 'react-hook-form';
import {
  EMAIL_STATUS_FIELD_KEYS,
  METADATA_ITEM_LABELS,
  metadataFields,
  metadataKeyField,
  requiredMetadataKeys,
} from './namespace-wizard-fields';
import type {
  EmailIntegrationDraft,
  ExistingNamespaces,
  FormValues,
  MetadataResourceName,
  MetadataRow,
  NamespaceWizardDraft,
  WizardStepId,
} from './namespace-wizard-types';

/** Field key → message. Empty means valid. */
export type FieldErrorMap = Record<string, string>;
/** Row index → field key → message. */
export type RowErrorMap = Record<number, FieldErrorMap>;

export interface WizardValidationContext {
  existing: ExistingNamespaces;
  /** Set once the namespace is created by this wizard; it then no longer counts as taken. */
  createdNamespace?: string;
}

export const NAMESPACE_PATTERN = /^[A-Z0-9_]+$/;
export const SHORT_CODE_PATTERN = /^[A-Z0-9]+$/;
const LABEL_RESOURCE_NAME_PATTERN = /^[A-Z0-9_]+$/;

const text = (value: unknown): string =>
  typeof value === 'string' ? value.trim()
  : value == null ? ''
  : String(value);

const fieldLabel = (resourceName: string, key: string) =>
  getResourceConfig(resourceName)?.fields.find((field) => field.key === key)?.label ?? key;

const requiredMessage = (resourceName: string, key: string) => `${fieldLabel(resourceName, key)} är obligatoriskt`;

export function validateNamespaceConfig(values: FormValues, context: WizardValidationContext): FieldErrorMap {
  const errors: FieldErrorMap = {};
  const namespace = text(values.namespace);
  const shortCode = text(values.shortCode);
  const isOwnNamespace = Boolean(context.createdNamespace) && namespace === context.createdNamespace;

  if (!namespace) errors.namespace = requiredMessage('namespaces', 'namespace');
  else if (!NAMESPACE_PATTERN.test(namespace)) errors.namespace = 'Namespace får bara innehålla A–Z, 0–9 och _.';
  else if (!isOwnNamespace && context.existing.namespaces.includes(namespace)) {
    errors.namespace = `Namespace "${namespace}" finns redan.`;
  }

  if (!text(values.displayName)) errors.displayName = requiredMessage('namespaces', 'displayName');

  if (!shortCode) errors.shortCode = requiredMessage('namespaces', 'shortCode');
  else if (!SHORT_CODE_PATTERN.test(shortCode)) errors.shortCode = 'Kortkoden får bara innehålla A–Z och 0–9.';
  else {
    const owner = context.existing.shortCodes.find(
      (existing) => existing.shortCode === shortCode && !(isOwnNamespace && existing.namespace === namespace)
    );
    if (owner) errors.shortCode = `Kortkoden "${shortCode}" används redan av ${owner.namespace}.`;
  }

  const ttl = text(values.notificationTTLInDays);
  if (!ttl) errors.notificationTTLInDays = requiredMessage('namespaces', 'notificationTTLInDays');
  else if (!Number.isInteger(Number(ttl)) || Number(ttl) < 1) {
    errors.notificationTTLInDays = 'Ange ett heltal som är minst 1.';
  }

  return errors;
}

export interface MetadataValidation {
  rows: RowErrorMap;
  list?: string;
}

export function validateMetadataRows(
  resourceName: MetadataResourceName,
  rows: MetadataRow[],
  options: { requireAtLeastOne?: boolean } = {}
): MetadataValidation {
  const keyField = metadataKeyField(resourceName);
  const requiredKeys = requiredMetadataKeys(resourceName);
  const fields = metadataFields(resourceName);
  const { singular } = METADATA_ITEM_LABELS[resourceName];
  const seenKeys = new Set<string>();
  const rowErrors: RowErrorMap = {};

  rows.forEach((row, index) => {
    const errors: FieldErrorMap = {};
    requiredKeys.forEach((key) => {
      if (!text(row[key])) {
        errors[key] = `${fields.find((field) => field.key === key)?.label ?? key} är obligatoriskt`;
      }
    });

    const itemKey = text(row[keyField]);
    if (itemKey) {
      const normalizedKey = itemKey.toLocaleUpperCase('sv');
      if (seenKeys.has(normalizedKey)) errors[keyField] = `${singular} "${itemKey}" finns redan.`;
      seenKeys.add(normalizedKey);
    }

    if (Object.keys(errors).length) rowErrors[index] = errors;
  });

  const list =
    options.requireAtLeastOne && rows.length === 0 ? `Lägg till minst en ${singular.toLowerCase()}.` : undefined;
  return { rows: rowErrors, list };
}

export function validateLabelTree(labels: LabelNode[]): string[] {
  const messages: string[] = [];

  const visit = (items: LabelNode[], path: string[]) => {
    const siblingNames = new Set<string>();
    items.forEach((label) => {
      const name = label.displayName || label.resourceName || label.classification || '(namnlös)';
      const where = [...path, name].join(' / ');
      if (!text(label.classification)) messages.push(`Etiketten ${where} saknar klassificering.`);
      if (!LABEL_RESOURCE_NAME_PATTERN.test(label.resourceName ?? '')) {
        messages.push(`Etiketten ${where} har ett ogiltigt resursnamn (A–Z, 0–9 och _).`);
      } else if (siblingNames.has(label.resourceName)) {
        messages.push(`Resursnamnet ${label.resourceName} finns två gånger under ${path.join(' / ') || 'rotnivån'}.`);
      }
      siblingNames.add(label.resourceName);
      visit(label.labels ?? [], [...path, name]);
    });
  };

  visit(labels, []);
  return messages;
}

export function validateEmailIntegrationDraft(
  emailIntegration: EmailIntegrationDraft,
  statuses: MetadataRow[],
  roles: MetadataRow[]
): FieldErrorMap {
  if (!emailIntegration.configure) return {};

  const values = emailIntegration.values;
  const errors: FieldErrorMap = {};
  const statusNames = new Set(statuses.map((status) => text(status.name)).filter(Boolean));
  const roleNames = new Set(roles.map((role) => text(role.name)).filter(Boolean));

  EMAIL_STATUS_FIELD_KEYS.forEach((key) => {
    const status = text(values[key]);
    if (status && !statusNames.has(status)) errors[key] = `Statusen "${status}" finns inte bland statusarna i steg 2.`;
  });
  if (!text(values.statusForNew)) errors.statusForNew = requiredMessage('emailIntegration', 'statusForNew');

  if (text(values.triggerStatusChangeOn) && !text(values.statusChangeTo)) {
    errors.statusChangeTo = 'Ange vilken status ärendet ska byta till.';
  }
  if (text(values.daysOfInactivityBeforeReject)) {
    const days = Number(text(values.daysOfInactivityBeforeReject));
    if (!Number.isInteger(days) || days < 1) errors.daysOfInactivityBeforeReject = 'Ange ett heltal som är minst 1.';
    else if (!text(values.inactiveStatus)) errors.inactiveStatus = 'Ange vilken status som räknas som inaktiv.';
  }

  const stakeholderRole = text(values.stakeholderRole);
  if (values.addSenderAsStakeholder === true && !stakeholderRole) {
    errors.stakeholderRole = 'Ange vilken roll avsändaren ska få.';
  } else if (stakeholderRole && !roleNames.has(stakeholderRole)) {
    errors.stakeholderRole = `Rollen "${stakeholderRole}" finns inte bland rollerna i steg 2.`;
  }

  ['errandNewEmailSender', 'errandClosedEmailSender'].forEach((key) => {
    const sender = text(values[key]);
    if (sender && !isValidEmail(sender)) errors[key] = 'Ange en giltig e-postadress, till exempel namn@domän.se.';
  });

  return errors;
}

const metadataMessages = (resourceName: MetadataResourceName, validation: MetadataValidation): string[] => {
  const { plural } = METADATA_ITEM_LABELS[resourceName];
  const rowMessages = Object.values(validation.rows).flatMap((errors) => Object.values(errors));
  return [...(validation.list ? [validation.list] : []), ...rowMessages].map((message) => `${plural}: ${message}`);
};

/** Every problem in one step, as messages. An empty list means the step is valid. */
export function validateStep(
  stepId: WizardStepId,
  draft: NamespaceWizardDraft,
  context: WizardValidationContext
): string[] {
  switch (stepId) {
    case 'namespace':
      return Object.values(validateNamespaceConfig(draft.namespaceConfig, context));
    case 'statusesAndRoles':
      return [
        ...metadataMessages('statuses', validateMetadataRows('statuses', draft.statuses, { requireAtLeastOne: true })),
        ...metadataMessages('roles', validateMetadataRows('roles', draft.roles)),
      ];
    case 'contactReasonsAndLabels':
      return [
        ...metadataMessages('contactReasons', validateMetadataRows('contactReasons', draft.contactReasons)),
        ...validateLabelTree(draft.labels).map((message) => `Etiketter: ${message}`),
      ];
    case 'emailIntegration':
      return Object.values(validateEmailIntegrationDraft(draft.emailIntegration, draft.statuses, draft.roles)).map(
        (message) => `E-postintegration: ${message}`
      );
    case 'review':
      return [];
  }
}

/** A react-hook-form resolver around one of the validators above, so forms and steps share the rules. */
export function fieldErrorsResolver(validate: (values: FormValues) => FieldErrorMap): Resolver<FormValues> {
  return async (values) => {
    const errors = validate(values);
    if (Object.keys(errors).length === 0) return { values, errors: {} };
    const fieldErrors: FieldErrors<FormValues> = Object.fromEntries(
      Object.entries(errors).map(([key, message]) => [key, { type: 'validate', message }])
    );
    return { values: {}, errors: fieldErrors };
  };
}
