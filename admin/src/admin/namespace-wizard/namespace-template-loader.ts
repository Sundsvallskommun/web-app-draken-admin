import { fetchResourceRecord, fetchResourceRows } from '@admin/use-resource-data';
import { getLabels } from '@services/label-service';
import { namespaceTemplateFromRecords } from './namespace-template-mapping';
import type { NamespaceTemplate } from './namespace-wizard-types';

export interface LoadedNamespaceTemplate {
  template: NamespaceTemplate;
  /** Swedish names of the parts that could not be read; the rest is still used. */
  failedParts: string[];
}

const settledValue = <T>(result: PromiseSettledResult<T>): T | undefined =>
  result.status === 'fulfilled' ? result.value : undefined;

/** Reads everything the wizard can copy from `sourceNamespace`. */
export async function loadNamespaceTemplate(
  municipalityId: number,
  sourceNamespace: string
): Promise<LoadedNamespaceTemplate> {
  const [namespace, statuses, roles, contactReasons, labels, emailIntegration] = await Promise.allSettled([
    fetchResourceRecord('namespaces', municipalityId, sourceNamespace),
    fetchResourceRows('statuses', municipalityId, sourceNamespace),
    fetchResourceRows('roles', municipalityId, sourceNamespace),
    fetchResourceRows('contactReasons', municipalityId, sourceNamespace),
    getLabels(municipalityId, sourceNamespace).then((response) => response.data.data ?? []),
    fetchResourceRecord('emailIntegration', municipalityId, sourceNamespace),
  ]);

  const parts: [string, PromiseSettledResult<unknown>][] = [
    ['namespace', namespace],
    ['statusar', statuses],
    ['roller', roles],
    ['kontaktorsaker', contactReasons],
    ['etiketter', labels],
    ['e-postintegration', emailIntegration],
  ];

  return {
    template: namespaceTemplateFromRecords({
      namespace: settledValue(namespace),
      statuses: settledValue(statuses),
      roles: settledValue(roles),
      contactReasons: settledValue(contactReasons),
      labels: settledValue(labels),
      emailIntegration: settledValue(emailIntegration),
    }),
    failedParts: parts.filter(([, result]) => result.status === 'rejected').map(([name]) => name),
  };
}
