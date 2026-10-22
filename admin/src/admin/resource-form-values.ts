import { toCategoryTypePayload, toCategoryTypeRows } from '@admin/category-types';
import { type FieldDef, type ResourceConfig, type ResourceRow } from '@admin/resource-config';
import type { TextEditorProps } from '@sk-web-gui/text-editor';

/**
 * Converts between API records and the form values the FieldDef-driven forms
 * work with (rich text split into plain text + markup, synced keys, numbers).
 */

export type RichTextValue = NonNullable<TextEditorProps['value']>;

export function defaultFieldValue(
  field: FieldDef,
  initial: ResourceRow | undefined,
  defaults: Record<string, unknown>
) {
  if (field.type === 'categoryTypes') return toCategoryTypeRows(initial?.[field.key] ?? defaults[field.key]);
  const v = initial?.[field.key];
  if (v !== undefined) return v;
  if (field.richTextTargets) {
    const plainText = initial?.[field.richTextTargets.plainText] ?? defaults[field.richTextTargets.plainText];
    const markup = initial?.[field.richTextTargets.markup] ?? defaults[field.richTextTargets.markup];
    return {
      plainText: typeof plainText === 'string' ? plainText : '',
      markup: typeof markup === 'string' ? markup : undefined,
    };
  }
  for (const key of field.syncKeys ?? []) {
    const syncedValue = initial?.[key] ?? defaults[key];
    if (syncedValue !== undefined && syncedValue !== null && syncedValue !== '') return syncedValue;
  }
  const d = defaults[field.key];
  if (d !== undefined) return d;
  return (
    field.type === 'switch' ? false
    : field.type === 'number' ? ''
    : ''
  );
}

/** Form values for every field of `fields`, taken from `initial` and falling back to `defaults`. */
export function defaultFieldValues(
  fields: FieldDef[],
  initial: ResourceRow | undefined,
  defaults: Record<string, unknown>
): Record<string, unknown> {
  return Object.fromEntries(fields.map((field) => [field.key, defaultFieldValue(field, initial, defaults)]));
}

export function normalizeResourceValues(resource: Pick<ResourceConfig, 'fields'>, values: Record<string, unknown>) {
  const normalized = { ...values };
  for (const field of resource.fields) {
    if (field.richTextTargets) {
      const value = normalized[field.key] as RichTextValue | string | undefined;
      const plainText =
        typeof value === 'object' ? value.plainText
        : typeof value === 'string' ? value
        : '';
      const markup =
        typeof value === 'object' ? value.markup
        : typeof value === 'string' ? value
        : '';
      normalized[field.richTextTargets.plainText] = plainText ?? '';
      normalized[field.richTextTargets.markup] = markup ?? '';
      delete normalized[field.key];
    }
    if (field.syncKeys?.length) {
      const value = normalized[field.key] ?? '';
      field.syncKeys.forEach((key) => {
        normalized[key] = value;
      });
      delete normalized[field.key];
    }
    if (field.type === 'number') {
      const value = normalized[field.key];
      normalized[field.key] = value === '' || value == null ? undefined : Number(value);
    }
    if (field.type === 'categoryTypes') {
      normalized[field.key] = toCategoryTypePayload(normalized[field.key]);
    }
  }
  return normalized;
}
