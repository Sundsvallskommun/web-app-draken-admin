import realResources from '@config/resources';
import { getPocResource, type PocResource, type PocRow } from '@poc/poc-resources';
import { useLocalStorage } from '@utils/use-localstorage.hook';
import * as React from 'react';

/**
 * Data layer for the shadcn admin. Fetches real data through the SAME service
 * layer the existing admin uses (`@config/resources` → backend on
 * NEXT_PUBLIC_API_URL, with the session cookie). If the call fails (e.g. not
 * logged in → 401), it falls back to the static example rows so the UI still
 * renders, and reports `source` so the page can show a banner.
 *
 * Writes (create/update/remove) delegate to the same `@config/resources`
 * wrappers the old admin used, with the same id conventions (see apiEditId).
 * Callers only invoke them when `source === 'api'` (real data loaded); on
 * fallback data writes stay dry-run so we never mutate against example rows.
 */

export type RowSource = 'api' | 'mock' | 'mock-fallback';

// Stable per-row key used ONLY for edit routing (mirrors the mock ids and the
// real list pages' `${namespace}/${name}`). The real row fields are preserved
// untouched on the row for writes — this is stored separately as `__key`.
export function computeRowId(resource: PocResource, row: Record<string, unknown>): string {
  const primary = resource.fields[0].key;
  if (primary === 'namespace') return String(row.namespace ?? '');
  if (resource.name === 'labels') return String(row.id ?? row[primary] ?? '');
  const hasNamespace = resource.fields.some((f) => f.key === 'namespace' && f.type === 'select');
  const key = row[primary] ?? row.id ?? '';
  return hasNamespace && row.namespace ? `${row.namespace}/${key}` : String(key);
}

// The identifier each resource's update/remove wrapper expects — matches the
// composite ids the old list pages built from the real record.
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
      // statuses / roles / categories / contactReasons → `${namespace}/${id}`
      return `${row.namespace}/${row.id}`;
  }
}

const withKeys = (resource: PocResource, rows: Record<string, unknown>[]): PocRow[] =>
  rows.map((r) => ({ ...r, id: (r.id as string) ?? computeRowId(resource, r), __key: computeRowId(resource, r) }));

interface PocRowsState {
  rows: PocRow[];
  loading: boolean;
  error: string | null;
  source: RowSource;
}

export function usePocRows(resourceName: string | undefined, namespace?: string) {
  const resource = getPocResource(resourceName);
  const municipalityId = useLocalStorage((s) => s.municipalityId);
  const [state, setState] = React.useState<PocRowsState>({ rows: [], loading: true, error: null, source: 'mock' });

  const fetchData = React.useCallback(async () => {
    if (!resource) {
      setState({ rows: [], loading: false, error: 'unknown-resource', source: 'mock' });
      return;
    }
    const mockRows = withKeys(resource, resource.rows);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getMany = (realResources as any)[resource.name]?.getMany;
    if (!getMany) {
      setState({ rows: mockRows, loading: false, error: null, source: 'mock' });
      return;
    }

    setState((s) => ({ ...s, loading: true }));
    try {
      const filter = namespace ? { namespace } : undefined;
      const res = await getMany(municipalityId, filter);
      const raw: Record<string, unknown>[] = res?.data?.data ?? [];
      setState({ rows: withKeys(resource, raw), loading: false, error: null, source: 'api' });
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const status = (e as any)?.response?.status;
      setState({
        rows: mockRows,
        loading: false,
        error: status === 401 ? '401' : status ? String(status) : 'network',
        source: 'mock-fallback',
      });
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
 * omits large fields (e.g. template `content`). Falls back to the matching mock
 * row when not logged in. `id` is the route id (for templates = identifier).
 */
export function usePocRecord(resourceName: string | undefined, id: string | undefined) {
  const resource = getPocResource(resourceName);
  const municipalityId = useLocalStorage((s) => s.municipalityId);
  const [state, setState] = React.useState<{ row?: PocRow; loading: boolean; source: RowSource }>({
    loading: true,
    source: 'mock',
  });

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!resource || !id || id === 'new') {
        if (!cancelled) setState({ row: undefined, loading: false, source: 'mock' });
        return;
      }
      const mock = withKeys(resource, resource.rows).find((r) => r.__key === id);
      const getOne = svc(resource.name)?.getOne;
      if (!getOne) {
        if (!cancelled) setState({ row: mock, loading: false, source: 'mock' });
        return;
      }
      try {
        const res = await getOne(municipalityId, id);
        const data: Record<string, unknown> | undefined = res?.data?.data ?? res?.data;
        if (!cancelled) {
          setState(
            data
              ? { row: { ...data, __key: computeRowId(resource, data) } as PocRow, loading: false, source: 'api' }
              : { row: mock, loading: false, source: 'mock' }
          );
        }
      } catch {
        if (!cancelled) setState({ row: mock, loading: false, source: 'mock-fallback' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [resourceName, id, municipalityId, resource]);

  return { ...state, resource };
}

// --- Writes: delegate to the real @config/resources wrappers ---------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const svc = (name: string): any => (realResources as any)[name];

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
