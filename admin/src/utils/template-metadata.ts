export const TEST_STATUS_KEY = 'testStatus';
export const TEST_APPROVED_AT_KEY = 'testApprovedAt';
export const TEST_STATUS_APPROVED = 'approved';

/**
 * Extract a value from template metadata.
 * Handles metadata as either an array or a JSON string.
 */
export function getMetadataValue(metadata: unknown, key: string): string | undefined {
  let entries: Array<{ key: string; value: string }>;

  if (Array.isArray(metadata)) {
    entries = metadata;
  } else if (typeof metadata === 'string' && metadata.length > 0) {
    try {
      const parsed = JSON.parse(metadata);
      entries = Array.isArray(parsed) ? parsed : [];
    } catch {
      return undefined;
    }
  } else {
    return undefined;
  }

  return entries.find((m) => m.key === key)?.value;
}

export function isTemplateApproved(metadata: unknown): boolean {
  return getMetadataValue(metadata, TEST_STATUS_KEY) === TEST_STATUS_APPROVED;
}

export function getApprovalTimestamp(metadata: unknown): string | undefined {
  return getMetadataValue(metadata, TEST_APPROVED_AT_KEY);
}

export function stripTestApprovalMetadata(metadata: string): string {
  try {
    const entries: Array<{ key: string; value: string }> = JSON.parse(metadata);
    const filtered = entries.filter((item) => item.key !== TEST_STATUS_KEY && item.key !== TEST_APPROVED_AT_KEY);
    return JSON.stringify(filtered, null, 2);
  } catch {
    return metadata;
  }
}
