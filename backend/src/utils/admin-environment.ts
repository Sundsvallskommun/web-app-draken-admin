export type AdminEnvironmentKind = 'production' | 'test';

export interface AdminEnvironment {
  environment: AdminEnvironmentKind;
}

export function adminEnvironmentFromApiBaseUrl(apiBaseUrl?: string): AdminEnvironment {
  const value = apiBaseUrl?.trim().toLowerCase();
  if (!value) return { environment: 'production' };

  try {
    const host = new URL(value).hostname;
    return { environment: host.includes('-test') ? 'test' : 'production' };
  } catch {
    return { environment: value.includes('-test') ? 'test' : 'production' };
  }
}
