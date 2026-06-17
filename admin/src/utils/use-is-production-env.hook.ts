import { checkCompareAvailable } from '@services/compare-service';
import { useEffect, useState } from 'react';

// We treat "compare is configured" as the signal that we are running in the
// production environment, since compare is only wired up there (pointing at test).
// Approval-for-production is a test-environment concept and should not be exposed in prod.
//
// The lookup is cached at module level so the consumers share a single
// /compare/available request per session instead of each firing their own.
let cachedAvailability: Promise<boolean> | null = null;
const getCompareAvailable = (): Promise<boolean> => {
  if (!cachedAvailability) {
    cachedAvailability = checkCompareAvailable();
  }
  return cachedAvailability;
};

export function useIsProductionEnv(): { isProduction: boolean; loaded: boolean; showTestFeatures: boolean } {
  const [isProduction, setIsProduction] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getCompareAvailable().then((available) => {
      if (cancelled) return;
      setIsProduction(available);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Test/approval features must stay hidden until we KNOW we are not in production,
  // otherwise they would flash visible on first render before the async check resolves.
  return { isProduction, loaded, showTestFeatures: loaded && !isProduction };
}
