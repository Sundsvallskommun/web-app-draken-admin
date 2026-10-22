import { useNamespaces } from '@admin/use-namespaces';
import { useResourceRows } from '@admin/use-resource-data';
import * as React from 'react';
import type { ExistingNamespaces } from './namespace-wizard-types';

/**
 * Namespaces a new one must not collide with: the supportmanagement ones (with their short
 * codes) plus the casedata names that only the "all namespaces" list includes.
 */
export function useExistingNamespaces() {
  const { rows, loading } = useResourceRows('namespaces');
  const allNamespaceOptions = useNamespaces();

  const existing = React.useMemo<ExistingNamespaces>(
    () => ({
      namespaces: [
        ...new Set([
          ...rows.map((row) => String(row.namespace ?? '')),
          ...allNamespaceOptions.map((option) => option.value),
        ]),
      ].filter(Boolean),
      shortCodes: rows
        .filter((row) => typeof row.shortCode === 'string' && row.shortCode !== '')
        .map((row) => ({ shortCode: String(row.shortCode), namespace: String(row.namespace ?? '') })),
    }),
    [rows, allNamespaceOptions]
  );

  return { existing, supportManagementNamespaces: rows, loading };
}
