import { isValidEmail } from '@utils/email';

/** One editable category type row. Optional API fields are kept as '' while editing. */
export interface CategoryTypeRow {
  name: string;
  displayName: string;
  escalationEmail: string;
  deprecated: boolean;
}

export interface CategoryTypePayload {
  name: string;
  displayName?: string;
  escalationEmail?: string;
  deprecated: boolean;
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const textValue = (value: unknown): string => (typeof value === 'string' ? value : '');

export const emptyCategoryTypeRow = (): CategoryTypeRow => ({
  name: '',
  displayName: '',
  escalationEmail: '',
  deprecated: false,
});

/** Form rows from the types of an API category, keeping only the fields the form edits. */
export function toCategoryTypeRows(types: unknown): CategoryTypeRow[] {
  if (!Array.isArray(types)) return [];
  return types.filter(isRecord).map((type) => ({
    name: textValue(type.name),
    displayName: textValue(type.displayName),
    escalationEmail: textValue(type.escalationEmail),
    deprecated: type.deprecated === true,
  }));
}

/**
 * API payload for the rows. Supportmanagement replaces all types of a category on save,
 * so every type is sent with its deprecated flag, and blank optional fields are left out.
 */
export function toCategoryTypePayload(rows: unknown): CategoryTypePayload[] {
  return toCategoryTypeRows(rows).map((row) => {
    const displayName = row.displayName.trim();
    const escalationEmail = row.escalationEmail.trim();
    return {
      name: row.name.trim(),
      ...(displayName ? { displayName } : {}),
      ...(escalationEmail ? { escalationEmail } : {}),
      deprecated: row.deprecated,
    };
  });
}

/** Returns true when all rows are valid, otherwise a message describing the first problem. */
export function validateCategoryTypes(rows: unknown): true | string {
  const typeRows = toCategoryTypeRows(rows);
  const names = typeRows.map((row) => row.name.trim());

  if (names.some((name) => !name)) return 'Varje typ behöver ett namn.';

  const duplicateName = names.find((name, index) => names.indexOf(name) !== index);
  if (duplicateName) return `Typen "${duplicateName}" finns redan.`;

  const rowWithInvalidEmail = typeRows.find(
    (row) => row.escalationEmail.trim() && !isValidEmail(row.escalationEmail.trim())
  );
  if (rowWithInvalidEmail) {
    return `Ange en giltig eskaleringsadress för typen "${rowWithInvalidEmail.name.trim()}", till exempel namn@domän.se.`;
  }

  return true;
}
