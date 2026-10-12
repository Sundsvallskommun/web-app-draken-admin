//Subscribed APIS as lowercased
export const APIS = [
  {
    name: 'simulatorserver',
    version: '2.0',
  },
  {
    name: 'templating',
    version: '2.1',
  },
  {
    name: 'supportmanagement',
    version: '15.2',
  },
  {
    name: 'support-management-alkt-sprint',
    version: '17.1',
  },
  {
    name: 'jsonschema',
    version: '1.0',
  },
] as const;

/**
 * Whether gateway URLs include the pinned API version (`supportmanagement/15.2`) or only the
 * API name (`supportmanagement`), which makes the gateway route to the latest version.
 * Controlled by the USE_API_VERSION env var; anything but the literal "false" keeps versions on.
 * Read at call time because dotenv is loaded after this module is imported.
 */
export function useApiVersion(): boolean {
  return process.env.USE_API_VERSION !== 'false';
}

export function apiServiceName(name: string): string {
  const resolvedName = API_SERVICE_ALIASES[name] ?? name;
  const api = APIS.find(a => a.name === resolvedName);
  if (!api) return name;
  return useApiVersion() ? `${api.name}/${api.version}` : api.name;
}

// Temporary routing for the Support Management development sprint.
// Remove this alias and rename the APIS entry when the sprint API is retired.
const API_SERVICE_ALIASES: Readonly<Record<string, string>> = {
  supportmanagement: 'support-management-alkt-sprint',
};
