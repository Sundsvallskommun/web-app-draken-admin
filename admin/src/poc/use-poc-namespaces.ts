import { Api } from '@data-contracts/backend/Api';
import { pocNamespaces } from '@poc/poc-resources';
import { useLocalStorage } from '@utils/use-localstorage.hook';
import * as React from 'react';

export interface NsOption {
  value: string;
  label: string;
}

const fallbackOptions: NsOption[] = pocNamespaces.map((ns) => ({
  value: ns.namespace,
  label: `${ns.displayName} (${ns.namespace})`,
}));

/**
 * Namespace options for selects/filters. Fetches the full list from the same
 * endpoint the old admin used (namespaceControllerGetNamespaces → all
 * namespaces for the municipality); falls back to the static example list when
 * not logged in. Refetches when the municipality changes.
 */
export function usePocNamespaces(): NsOption[] {
  const municipalityId = useLocalStorage((s) => s.municipalityId);
  const [options, setOptions] = React.useState<NsOption[]>(fallbackOptions);

  React.useEffect(() => {
    let cancelled = false;
    const api = new Api({ baseURL: process.env.NEXT_PUBLIC_API_URL, withCredentials: true });
    api
      .namespaceControllerGetNamespaces(municipalityId)
      .then((res) => {
        const list: Array<{ namespace: string; displayName?: string }> = res?.data?.data ?? [];
        if (!cancelled && list.length) {
          setOptions(
            list.map((ns) => ({
              value: ns.namespace,
              label: ns.displayName ? `${ns.displayName} (${ns.namespace})` : ns.namespace,
            }))
          );
        }
      })
      .catch(() => {
        /* not logged in / API down → keep fallback */
      });
    return () => {
      cancelled = true;
    };
  }, [municipalityId]);

  return options;
}
