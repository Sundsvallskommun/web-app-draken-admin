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
    version: '15.3',
  },
  {
    name: 'jsonschema',
    version: '1.0',
  },
] as const;

export function apiServiceName(name: string): string {
  const resolvedName = API_SERVICE_ALIASES[name] ?? name;
  const api = APIS.find(a => a.name === resolvedName);
  return api ? `${api.name}/${api.version}` : name;
}

// Temporary routing for the Support Management development sprint.
// Remove this alias and rename the APIS entry when the sprint API is retired.
const API_SERVICE_ALIASES: Readonly<Record<string, string>> = {
  supportmanagement: 'support-management-alkt-sprint',
};
