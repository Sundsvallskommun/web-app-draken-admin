import { createRow, fetchResourceRecord, fetchResourceRows, updateRow } from '@admin/use-resource-data';
import type { LabelNode } from '@interfaces/label';
import { getLabels, saveLabels } from '@services/label-service';
import { metadataKeyField } from './namespace-wizard-fields';
import type { FormValues, MetadataResourceName } from './namespace-wizard-types';

/** The calls the submission runner makes; a seam so the runner can be tested without a backend. */
export interface NamespaceSubmissionApi {
  listNamespaces: (municipalityId: number) => Promise<string[]>;
  createNamespace: (municipalityId: number, payload: FormValues) => Promise<unknown>;
  listMetadataKeys: (
    resourceName: MetadataResourceName,
    municipalityId: number,
    namespace: string
  ) => Promise<string[]>;
  createMetadata: (resourceName: MetadataResourceName, municipalityId: number, payload: FormValues) => Promise<unknown>;
  getLabels: (municipalityId: number, namespace: string) => Promise<LabelNode[]>;
  saveLabels: (municipalityId: number, namespace: string, labels: LabelNode[], isNew: boolean) => Promise<unknown>;
  hasEmailIntegration: (municipalityId: number, namespace: string) => Promise<boolean>;
  createEmailIntegration: (municipalityId: number, payload: FormValues) => Promise<unknown>;
  updateEmailIntegration: (municipalityId: number, namespace: string, payload: FormValues) => Promise<unknown>;
}

const isNotFound = (error: unknown) =>
  (error as { response?: { status?: number } } | undefined)?.response?.status === 404;

/** A namespace without metadata yet may answer 404 instead of an empty list. */
const emptyWhenNotFound = async <T>(request: Promise<T[]>): Promise<T[]> => {
  try {
    return await request;
  } catch (error) {
    if (isNotFound(error)) return [];
    throw error;
  }
};

export const namespaceSubmissionApi: NamespaceSubmissionApi = {
  listNamespaces: async (municipalityId) =>
    (await fetchResourceRows('namespaces', municipalityId)).map((row) => String(row.namespace ?? '')),

  createNamespace: (municipalityId, payload) => createRow('namespaces', municipalityId, payload),

  listMetadataKeys: async (resourceName, municipalityId, namespace) => {
    const keyField = metadataKeyField(resourceName);
    const rows = await emptyWhenNotFound(fetchResourceRows(resourceName, municipalityId, namespace));
    return rows.map((row) => String(row[keyField] ?? ''));
  },

  createMetadata: (resourceName, municipalityId, payload) => createRow(resourceName, municipalityId, payload),

  getLabels: async (municipalityId, namespace) =>
    emptyWhenNotFound(getLabels(municipalityId, namespace).then((response) => response.data.data ?? [])),

  saveLabels: (municipalityId, namespace, labels, isNew) => saveLabels(municipalityId, namespace, labels, isNew),

  hasEmailIntegration: async (municipalityId, namespace) =>
    (await fetchResourceRecord('emailIntegration', municipalityId, namespace)) !== undefined,

  createEmailIntegration: (municipalityId, payload) => createRow('emailIntegration', municipalityId, payload),

  updateEmailIntegration: (municipalityId, namespace, payload) =>
    updateRow('emailIntegration', municipalityId, { id: namespace, namespace }, payload),
};
