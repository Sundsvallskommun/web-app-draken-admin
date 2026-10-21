import { Api } from '@data-contracts/backend/Api';
import type {
  Namespace,
  NamespaceDeleteReport,
  NamespaceImportDto,
  NamespaceImportReport,
} from '@data-contracts/backend/data-contracts';

const api = new Api({ baseURL: process.env.NEXT_PUBLIC_API_URL, withCredentials: true });

export interface ImportOptions {
  dryRun?: boolean;
  allowExisting?: boolean;
}

/** Validates (dryRun) or applies a namespace document. The backend always answers with a report. */
export async function importNamespace(
  municipalityId: number,
  document: NamespaceImportDto,
  options: ImportOptions
): Promise<NamespaceImportReport> {
  const res = await api.namespaceImportControllerImportNamespace(municipalityId, options, document);
  return res.data.data;
}

export async function exportNamespace(municipalityId: number, namespace: string): Promise<NamespaceImportDto> {
  const res = await api.namespaceImportControllerExportNamespace(municipalityId, namespace);
  return res.data.data;
}

/** Only supportmanagement namespaces: the `/all` route also lists casedata namespaces that cannot be exported. */
export async function listSupportManagementNamespaces(municipalityId: number): Promise<Namespace[]> {
  const res = await api.namespaceControllerGetSupportManagementNamespaces(municipalityId);
  return res.data.data ?? [];
}

/** Inspects (dryRun) or deletes a whole namespace. The backend refuses while errands remain. */
export async function deleteNamespace(municipalityId: number, namespace: string, dryRun: boolean): Promise<NamespaceDeleteReport> {
  const res = await api.namespaceImportControllerDeleteNamespace(municipalityId, namespace, { dryRun });
  return res.data.data;
}
