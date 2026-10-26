import { HttpClient } from '@config/http-client';
import type { AdminEnvironmentKind } from '@utils/admin-environment';

const httpClient = new HttpClient({ baseURL: process.env.NEXT_PUBLIC_API_URL, withCredentials: true });

interface AdminEnvironmentResponse {
  environment: AdminEnvironmentKind;
  namespaceDeleteEnabled?: boolean;
}

export interface AdminEnvironmentInfo {
  kind: AdminEnvironmentKind;
  /** Whether the backend runs with NAMESPACE_DELETE_ENABLED=true. */
  namespaceDeleteEnabled: boolean;
}

function normalizeEnvironment(value: unknown): AdminEnvironmentKind {
  return value === 'test' ? 'test' : 'production';
}

export async function fetchAdminEnvironment(): Promise<AdminEnvironmentInfo> {
  try {
    const res = await httpClient.request<{ data: AdminEnvironmentResponse }, unknown>({
      path: `${process.env.NEXT_PUBLIC_API_PATH}/admin/environment`,
      method: 'GET',
    });
    return {
      kind: normalizeEnvironment(res.data?.data?.environment),
      namespaceDeleteEnabled: res.data?.data?.namespaceDeleteEnabled === true,
    };
  } catch {
    return { kind: 'production', namespaceDeleteEnabled: false };
  }
}
