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
