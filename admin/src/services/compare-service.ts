import { HttpClient } from '@config/http-client';

const httpClient = new HttpClient({ baseURL: process.env.NEXT_PUBLIC_API_URL, withCredentials: true });

export interface CompareDetail {
  localContent?: string;
  compareContent?: string;
  localMetadata?: string;
  compareMetadata?: string;
  localDefaultValues?: string;
  compareDefaultValues?: string;
}

export interface CompareItem {
  identifier: string;
  name?: string;
  localVersion?: string;
  compareVersion?: string;
  differences?: string[];
  detail?: CompareDetail;
  templateType?: string;
}

export interface CompareResult {
  missingLocally: CompareItem[];
  missingInCompare: CompareItem[];
  different: CompareItem[];
}

export async function checkCompareAvailable(): Promise<boolean> {
  try {
    const res = await httpClient.request<{ data: { available: boolean } }, unknown>({
      path: `${process.env.NEXT_PUBLIC_API_PATH}/compare/available`,
      method: 'GET',
    });
    return res.data?.data?.available ?? false;
  } catch {
    return false;
  }
}

export async function fetchCompare(
  resourceType: string,
  municipalityId: number,
  namespace?: string,
): Promise<CompareResult> {
  const params = namespace ? `?namespace=${namespace}` : '';
  const res = await httpClient.request<{ data: CompareResult }, unknown>({
    path: `${process.env.NEXT_PUBLIC_API_PATH}/compare/${resourceType}/${municipalityId}${params}`,
    method: 'GET',
  });
  return res.data?.data;
}
