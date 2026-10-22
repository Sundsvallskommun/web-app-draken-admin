const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const stringValue = (value: unknown): string | undefined => (typeof value === 'string' ? value : undefined);

/** Readable message from an axios/backend error: `response.data.message`, then `message`, else "fel". */
export const errorMessage = (error: unknown): string => {
  if (!isRecord(error)) return 'fel';
  const response = isRecord(error.response) ? error.response : undefined;
  const data = isRecord(response?.data) ? response.data : undefined;
  return stringValue(data?.message) ?? stringValue(error.message) ?? 'fel';
};
