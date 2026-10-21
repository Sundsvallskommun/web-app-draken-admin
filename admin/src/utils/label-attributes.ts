import { LabelAttribute, LabelNode } from '@interfaces/label';

/** Conventional attribute key agreed between clients for the escalation email address. */
export const ESCALATION_EMAIL_KEY = 'escalationEmail';

/** Classifications that can carry an escalation recipient, mirroring the legacy category/type escalation email. */
const ESCALATION_EMAIL_CLASSIFICATIONS = ['CATEGORY', 'TYPE'];

export const isEscalationEmailApplicable = (classification: string): boolean =>
  ESCALATION_EMAIL_CLASSIFICATIONS.includes(classification.trim().toUpperCase());

/** Read the escalationEmail value from a label's free-form attributes, or '' if not set. */
export const getEscalationEmail = (label: LabelNode): string =>
  label.attributes?.find((attribute) => attribute.key === ESCALATION_EMAIL_KEY)?.value ?? '';

/**
 * Return a new attributes array with the escalationEmail key set to the trimmed value,
 * or removed when the value is empty. All other attribute keys are preserved untouched.
 */
export const setEscalationEmail = (attributes: LabelAttribute[] | undefined, value: string): LabelAttribute[] => {
  const trimmedValue = value.trim();
  const withoutEscalationEmail = (attributes ?? []).filter((attribute) => attribute.key !== ESCALATION_EMAIL_KEY);

  if (!trimmedValue) {
    return withoutEscalationEmail;
  }

  return [...withoutEscalationEmail, { key: ESCALATION_EMAIL_KEY, value: trimmedValue }];
};
