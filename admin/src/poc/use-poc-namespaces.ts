import { Api } from '@data-contracts/backend/Api';
import { useLocalStorage } from '@utils/use-localstorage.hook';
import * as React from 'react';

export interface NsOption {
  value: string;
  label: string;
}

/**
 * Namespace options for selects/filters — fetched from the backend
 * (namespaceControllerGetNamespaces → all namespaces for the municipality).
 * Refetches when the municipality changes.
 */
export function usePocNamespaces(): NsOption[] {
  const municipalityId = useLocalStorage((s) => s.municipalityId);
  const [options, setOptions] = React.useState<NsOption[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    const api = new Api({ baseURL: process.env.NEXT_PUBLIC_API_URL, withCredentials: true });
    api
      .namespaceControllerGetNamespaces(municipalityId)
      .then((res) => {
        const list: Array<{ namespace: string; displayName?: string }> = res?.data?.data ?? [];
        if (!cancelled) {
          setOptions(
            list.map((ns) => ({
              value: ns.namespace,
              label: ns.displayName ? `${ns.displayName} (${ns.namespace})` : ns.namespace,
            }))
          );
        }
      })
      .catch(() => {
        if (!cancelled) setOptions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [municipalityId]);

  return options;
}
