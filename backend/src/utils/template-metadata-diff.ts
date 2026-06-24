export type TemplateMetadataDiffEntry = {
  key?: string;
  fieldName?: string;
  value?: unknown;
  [property: string]: unknown;
};

const TEST_APPROVAL_METADATA_KEYS = new Set(['testStatus', 'testApprovedAt']);

const metadataName = (entry: TemplateMetadataDiffEntry): string => entry.key ?? entry.fieldName ?? '';

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, nested]) => [key, stableValue(nested)]),
    );
  }
  return value;
}

function stableString(value: unknown): string {
  return JSON.stringify(stableValue(value)) ?? String(value);
}

function canonicalEntry(entry: TemplateMetadataDiffEntry): TemplateMetadataDiffEntry {
  return Object.fromEntries(
    Object.entries(entry)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => [key, stableValue(value)]),
  ) as TemplateMetadataDiffEntry;
}

export function normalizeTemplateMetadataForDiff(metadata?: TemplateMetadataDiffEntry[]): TemplateMetadataDiffEntry[] {
  if (!metadata) return [];

  const unique = new Map<string, TemplateMetadataDiffEntry>();
  for (const entry of metadata) {
    if (TEST_APPROVAL_METADATA_KEYS.has(entry.key ?? '')) continue;

    const canonical = canonicalEntry(entry);
    unique.set(stableString(canonical), canonical);
  }

  return [...unique.values()].sort((a, b) => {
    const nameComparison = metadataName(a).localeCompare(metadataName(b));
    if (nameComparison !== 0) return nameComparison;

    const valueComparison = stableString(a.value).localeCompare(stableString(b.value));
    if (valueComparison !== 0) return valueComparison;

    return stableString(a).localeCompare(stableString(b));
  });
}
