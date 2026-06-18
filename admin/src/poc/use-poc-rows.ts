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
 */

export type RowSource = 'api' | 'mock' | 'mock-fallback';

// Stable per-row key used for edit routing. Reproduces the composite ids the
// real list pages build (`${namespace}/${id}`) and matches the mock ids.
export function computeRowId(resource: PocResource, row: Record<string, unknown>): string {
  const primary = resource.fields[0].key;
  if (primary === 'namespace') return String(row.namespace ?? '');
  if (resource.name === 'labels') return String(row.id ?? row[primary] ?? '');
  const hasNamespace = resource.fields.some((f) => f.key === 'namespace' && f.type === 'select');
  const key = row[primary] ?? row.id ?? '';
  return hasNamespace && row.namespace ? `${row.namespace}/${key}` : String(key);
}

const withIds = (resource: PocResource, rows: Record<string, unknown>[]): PocRow[] =>
  rows.map((r) => ({ ...r, id: computeRowId(resource, r) }));

interface PocRowsState {
  rows: PocRow[];
  loading: boolean;
  error: string | null;
  source: RowSource;
}

export function usePocRows(resourceName: string | undefined, namespace?: string) {
  const resource = getPocResource(resourceName);
  const municipalityId = useLocalStorage((s) => s.municipalityId);
  const [state, setState] = React.useState<PocRowsState>({
    rows: [],
    loading: true,
    error: null,
    source: 'mock',
  });

  const fetchData = React.useCallback(async () => {
    if (!resource) {
      setState({ rows: [], loading: false, error: 'unknown-resource', source: 'mock' });
      return;
    }
    const mockRows = withIds(resource, resource.rows);
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
      setState({ rows: withIds(resource, raw), loading: false, error: null, source: 'api' });
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
