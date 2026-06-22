export const TEST_STATUS_KEY = 'testStatus';
export const TEST_APPROVED_AT_KEY = 'testApprovedAt';
export const TEST_STATUS_APPROVED = 'approved';

export interface TemplateMetadataEntry {
  key: string;
  value: string;
}

export function parseTemplateMetadata(metadata: unknown): TemplateMetadataEntry[] {
  if (Array.isArray(metadata)) return metadata as TemplateMetadataEntry[];
  if (typeof metadata === 'string' && metadata.length > 0) {
    try {
      const parsed = JSON.parse(metadata);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Extract a value from template metadata.
 * Handles metadata as either an array or a JSON string.
 */
export function getMetadataValue(metadata: unknown, key: string): string | undefined {
  const entries = parseTemplateMetadata(metadata);
  return entries.find((m) => m.key === key)?.value;
}

export function isTemplateApproved(metadata: unknown): boolean {
  return getMetadataValue(metadata, TEST_STATUS_KEY) === TEST_STATUS_APPROVED;
}

export function getApprovalTimestamp(metadata: unknown): string | undefined {
  return getMetadataValue(metadata, TEST_APPROVED_AT_KEY);
}

export function replaceMetadataValue(entries: TemplateMetadataEntry[], key: string, value: string): TemplateMetadataEntry[] {
  const filtered = entries.filter((entry) => entry.key !== key);
  return value ? [...filtered, { key, value }] : filtered;
}

export function approveTemplateMetadata(metadata: unknown, approvedAt = new Date().toISOString()): TemplateMetadataEntry[] {
  const entries = parseTemplateMetadata(metadata);
  return replaceMetadataValue(
    replaceMetadataValue(entries, TEST_STATUS_KEY, TEST_STATUS_APPROVED),
    TEST_APPROVED_AT_KEY,
    approvedAt
  );
}

export function stripTestApprovalMetadata(metadata: string): string {
  try {
    const entries = parseTemplateMetadata(metadata);
    const filtered = entries.filter((item) => item.key !== TEST_STATUS_KEY && item.key !== TEST_APPROVED_AT_KEY);
    return JSON.stringify(filtered, null, 2);
  } catch {
    return metadata;
  }
}
