import { HttpClient } from '@config/http-client';
import type { AdminEnvironmentKind } from '@utils/admin-environment';

const httpClient = new HttpClient({ baseURL: process.env.NEXT_PUBLIC_API_URL, withCredentials: true });

interface AdminEnvironmentResponse {
  environment: AdminEnvironmentKind;
}

function normalizeEnvironment(value: unknown): AdminEnvironmentKind {
  return value === 'test' ? 'test' : 'production';
}

export async function fetchAdminEnvironment(): Promise<AdminEnvironmentKind> {
  try {
    const res = await httpClient.request<{ data: AdminEnvironmentResponse }, unknown>({
      path: `${process.env.NEXT_PUBLIC_API_PATH}/admin/environment`,
      method: 'GET',
    });
    return normalizeEnvironment(res.data?.data?.environment);
  } catch {
    return 'production';
  }
}
