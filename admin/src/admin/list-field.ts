/**
 * Helpers for `list` fields: string arrays in the API that the generic form
 * edits as comma-separated text.
 */
export function listToText(value: unknown): string {
  if (Array.isArray(value)) return value.map((item) => String(item)).join(', ');
  return typeof value === 'string' ? value : '';
}

export function textToList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value !== 'string') return [];
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}
