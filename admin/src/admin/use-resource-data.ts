import realResources from '@config/resources';
import { getResourceConfig, type ResourceConfig, type ResourceRow } from '@admin/resource-config';
import { useLocalStorage } from '@utils/use-localstorage.hook';
import * as React from 'react';

/**
 * Data layer for the admin. Fetches real data through the app's service layer
 * (`@config/resources` → backend on NEXT_PUBLIC_API_URL with the session
 * cookie). No mock/fallback data — on failure the caller shows an error state.
 */

type ResourceContract = {
  defaultValues?: Record<string, unknown>;
  requiredFields?: string[];
  getMany?: (...args: unknown[]) => Promise<unknown>;
  getOne?: (...args: unknown[]) => Promise<unknown>;
  create?: (...args: unknown[]) => Promise<unknown>;
  update?: (...args: unknown[]) => Promise<unknown>;
  remove?: (...args: unknown[]) => Promise<unknown>;
};

const resourceMap = realResources as Record<string, ResourceContract>;
const svc = (name: string): ResourceContract | undefined => resourceMap[name];

export function getResourceDefaults(name: string): Record<string, unknown> {
  return svc(name)?.defaultValues ?? {};
}

export function getResourceRequiredFields(name: string): string[] {
  return svc(name)?.requiredFields ?? [];
}

// Stable per-row key used for edit routing (`${namespace}/${id}` for namespaced
// resources). The real record fields are preserved untouched for writes.
export function computeRowId(resource: ResourceConfig, row: Record<string, unknown>): string {
  const primary = resource.fields[0].key;
  if (resource.name === 'featureFlags') return String(row.id ?? '');
  if (resource.name === 'templates') return String(row.identifier ?? row.id ?? '');
  if (primary === 'namespace') return String(row.namespace ?? '');
  if (resource.name === 'labels') return String(row.id ?? row[primary] ?? '');
  const hasNamespace = resource.fields.some((f) => f.key === 'namespace' && f.type === 'select');
  const key = row.id ?? row[primary] ?? '';
  return hasNamespace && row.namespace ? `${row.namespace}/${key}` : String(key);
}

// The identifier each resource's update/remove wrapper expects.
export function apiEditId(resource: ResourceConfig, row: ResourceRow): string | number {
  switch (resource.name) {
    case 'featureFlags':
    case 'jsonSchemas':
      return row.id as string | number;
    case 'templates':
      return row.identifier as string;
    case 'namespaces':
    case 'emailIntegration':
      return row.namespace as string;
    default:
      return `${row.namespace}/${row.id}`;
  }
}

const withKeys = (resource: ResourceConfig, rows: Record<string, unknown>[]): ResourceRow[] =>
  rows.map((r) => ({ ...r, id: (r.id as string) ?? computeRowId(resource, r), __key: computeRowId(resource, r) }));

type DataResponse<T> = { data?: { data?: T; message?: string } } | { data?: T };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const errorCode = (e: any): string => {
  const status = e?.response?.status;
  return status ? String(status) : 'network';
};

export async function fetchResourceRecord(
  name: string,
  municipalityId: number,
  id: string
): Promise<ResourceRow | undefined> {
  const resource = getResourceConfig(name);
  const getOne = svc(name)?.getOne;
  if (!resource || !getOne) return undefined;

  const res = (await getOne(municipalityId, id)) as DataResponse<Record<string, unknown>>;
  const data = ('data' in res && res.data && 'data' in res.data ? res.data.data : res.data) as
    | Record<string, unknown>
    | undefined;
  return data ? ({ ...data, __key: computeRowId(resource, data) } as ResourceRow) : undefined;
}

interface RowsState {
  rows: ResourceRow[];
  loading: boolean;
  error: string | null;
}

interface UseResourceRowsOptions {
  enabled?: boolean;
}

export function useResourceRows(
  resourceName: string | undefined,
  namespace?: string,
  options: UseResourceRowsOptions = {}
) {
  const resource = getResourceConfig(resourceName);
  const municipalityId = useLocalStorage((s) => s.municipalityId);
  const enabled = options.enabled ?? true;
  const [state, setState] = React.useState<RowsState>({ rows: [], loading: true, error: null });

  const fetchData = React.useCallback(async () => {
    if (!enabled) {
      setState({ rows: [], loading: false, error: null });
      return [];
    }
    if (!resource) {
      setState({ rows: [], loading: false, error: 'unknown-resource' });
      return [];
    }
    const getMany = svc(resource.name)?.getMany;
    if (!getMany) {
      setState({ rows: [], loading: false, error: 'no-endpoint' });
      return [];
    }
    setState((s) => ({ ...s, loading: true }));
    try {
      const res = (await getMany(municipalityId, namespace ? { namespace } : undefined)) as DataResponse<
        Record<string, unknown>[]
      >;
      const raw = ('data' in res && res.data && 'data' in res.data ? res.data.data : []) ?? [];
      const rows = withKeys(resource, raw);
      setState({ rows, loading: false, error: null });
      return rows;
    } catch (e) {
      setState({ rows: [], loading: false, error: errorCode(e) });
      return [];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, resource?.name, namespace, municipalityId]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...state, resource, refresh: fetchData };
}

/**
 * Fetch a SINGLE record via getOne — needed for resources whose list response
 * omits large fields (e.g. template `content`). `id` is the route id.
 */
export function useResourceRecord(resourceName: string | undefined, id: string | undefined) {
  const resource = getResourceConfig(resourceName);
  const municipalityId = useLocalStorage((s) => s.municipalityId);
  const [state, setState] = React.useState<{ row?: ResourceRow; loading: boolean; error: string | null }>({
    loading: true,
    error: null,
  });

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!resource || !id || id === 'new') {
        if (!cancelled) setState({ row: undefined, loading: false, error: null });
        return;
      }
      if (!svc(resource.name)?.getOne) {
        if (!cancelled) setState({ row: undefined, loading: false, error: 'no-endpoint' });
        return;
      }
      try {
        const row = await fetchResourceRecord(resource.name, municipalityId, id);
        if (!cancelled) {
          setState({
            row,
            loading: false,
            error: row ? null : 'not-found',
          });
        }
      } catch (e) {
        if (!cancelled) setState({ row: undefined, loading: false, error: errorCode(e) });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [resourceName, id, municipalityId, resource]);

  return { ...state, resource };
}

// --- Writes: delegate to the real @config/resources wrappers ---------------

export async function createRow(name: string, municipalityId: number, data: Record<string, unknown>) {
  const create = svc(name)?.create;
  if (!create) throw new Error(`create saknas för ${name}`);
  return create(municipalityId, data);
}

export async function updateRow(name: string, municipalityId: number, row: ResourceRow, data: Record<string, unknown>) {
  const resource = getResourceConfig(name)!;
  const update = svc(name)?.update;
  if (!update) throw new Error(`update saknas för ${name}`);
  return update(municipalityId, apiEditId(resource, row), data);
}

export async function removeRow(name: string, municipalityId: number, row: ResourceRow) {
  const resource = getResourceConfig(name)!;
  const remove = svc(name)?.remove;
  if (!remove) throw new Error(`remove saknas för ${name}`);
  return remove(municipalityId, row.namespace, apiEditId(resource, row));
}
