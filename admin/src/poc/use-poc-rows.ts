import realResources from '@config/resources';
import { getPocResource, type PocResource, type PocRow } from '@poc/poc-resources';
import { useLocalStorage } from '@utils/use-localstorage.hook';
import * as React from 'react';

/**
 * Data layer for the admin. Fetches real data through the app's service layer
 * (`@config/resources` → backend on NEXT_PUBLIC_API_URL with the session
 * cookie). No mock/fallback data — on failure the caller shows an error state.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const svc = (name: string): any => (realResources as any)[name];

// Stable per-row key used for edit routing (`${namespace}/${id}` for namespaced
// resources). The real record fields are preserved untouched for writes.
export function computeRowId(resource: PocResource, row: Record<string, unknown>): string {
  const primary = resource.fields[0].key;
  if (primary === 'namespace') return String(row.namespace ?? '');
  if (resource.name === 'labels') return String(row.id ?? row[primary] ?? '');
  const hasNamespace = resource.fields.some((f) => f.key === 'namespace' && f.type === 'select');
  const key = row[primary] ?? row.id ?? '';
  return hasNamespace && row.namespace ? `${row.namespace}/${key}` : String(key);
}

// The identifier each resource's update/remove wrapper expects.
export function apiEditId(resource: PocResource, row: PocRow): string | number {
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

const withKeys = (resource: PocResource, rows: Record<string, unknown>[]): PocRow[] =>
  rows.map((r) => ({ ...r, id: (r.id as string) ?? computeRowId(resource, r), __key: computeRowId(resource, r) }));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const errorCode = (e: any): string => {
  const status = e?.response?.status;
  return status ? String(status) : 'network';
};

interface PocRowsState {
  rows: PocRow[];
  loading: boolean;
  error: string | null;
}

export function usePocRows(resourceName: string | undefined, namespace?: string) {
  const resource = getPocResource(resourceName);
  const municipalityId = useLocalStorage((s) => s.municipalityId);
  const [state, setState] = React.useState<PocRowsState>({ rows: [], loading: true, error: null });

  const fetchData = React.useCallback(async () => {
    if (!resource) {
      setState({ rows: [], loading: false, error: 'unknown-resource' });
      return;
    }
    const getMany = svc(resource.name)?.getMany;
    if (!getMany) {
      setState({ rows: [], loading: false, error: 'no-endpoint' });
      return;
    }
    setState((s) => ({ ...s, loading: true }));
    try {
      const res = await getMany(municipalityId, namespace ? { namespace } : undefined);
      const raw: Record<string, unknown>[] = res?.data?.data ?? [];
      setState({ rows: withKeys(resource, raw), loading: false, error: null });
    } catch (e) {
      setState({ rows: [], loading: false, error: errorCode(e) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource?.name, namespace, municipalityId]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...state, resource, refresh: fetchData };
}

/**
 * Fetch a SINGLE record via getOne — needed for resources whose list response
 * omits large fields (e.g. template `content`). `id` is the route id.
 */
export function usePocRecord(resourceName: string | undefined, id: string | undefined) {
  const resource = getPocResource(resourceName);
  const municipalityId = useLocalStorage((s) => s.municipalityId);
  const [state, setState] = React.useState<{ row?: PocRow; loading: boolean; error: string | null }>({
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
      const getOne = svc(resource.name)?.getOne;
      if (!getOne) {
        if (!cancelled) setState({ row: undefined, loading: false, error: 'no-endpoint' });
        return;
      }
      try {
        const res = await getOne(municipalityId, id);
        const data: Record<string, unknown> | undefined = res?.data?.data ?? res?.data;
        if (!cancelled) {
          setState({
            row: data ? ({ ...data, __key: computeRowId(resource, data) } as PocRow) : undefined,
            loading: false,
            error: data ? null : 'not-found',
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

export async function updateRow(name: string, municipalityId: number, row: PocRow, data: Record<string, unknown>) {
  const resource = getPocResource(name)!;
  const update = svc(name)?.update;
  if (!update) throw new Error(`update saknas för ${name}`);
  return update(municipalityId, apiEditId(resource, row), data);
}

export async function removeRow(name: string, municipalityId: number, row: PocRow) {
  const resource = getPocResource(name)!;
  const remove = svc(name)?.remove;
  if (!remove) throw new Error(`remove saknas för ${name}`);
  return remove(municipalityId, row.namespace, apiEditId(resource, row));
}
