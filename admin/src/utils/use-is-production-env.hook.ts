import { fetchAdminEnvironment } from '@services/admin-environment-service';
import {
  adminEnvironmentFromKind,
  checkingAdminEnvironment,
  shouldTreatAsProduction,
  type AdminEnvironmentState,
} from '@utils/admin-environment';
import { useEffect, useState } from 'react';

const templateTestStatusEnabled = process.env.NEXT_PUBLIC_ENABLE_TEMPLATE_TEST_STATUS === 'true';

// The lookup is cached at module level so the consumers share a single
// /admin/environment request per session instead of each firing their own.
let cachedEnvironment: Promise<AdminEnvironmentState> | null = null;
const getAdminEnvironment = (): Promise<AdminEnvironmentState> => {
  if (!cachedEnvironment) {
    cachedEnvironment = fetchAdminEnvironment().then(adminEnvironmentFromKind);
  }
  return cachedEnvironment;
};

export function useAdminEnvironment(): {
  environment: AdminEnvironmentState;
  isProduction: boolean;
  loaded: boolean;
  showTestFeatures: boolean;
} {
  const [environment, setEnvironment] = useState<AdminEnvironmentState>(checkingAdminEnvironment());

  useEffect(() => {
    let cancelled = false;
    getAdminEnvironment().then((nextEnvironment) => {
      if (cancelled) return;
      setEnvironment(nextEnvironment);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const isProduction = shouldTreatAsProduction(environment);
  const loaded = environment.status !== 'checking';

  // Test/approval features must stay hidden until we KNOW we are in test,
  // otherwise they would flash visible on first render before the async check resolves.
  return {
    environment,
    isProduction,
    loaded,
    showTestFeatures: templateTestStatusEnabled && environment.kind === 'test',
  };
}

export function useIsProductionEnv(): {
  environment: AdminEnvironmentState;
  isProduction: boolean;
  loaded: boolean;
  showTestFeatures: boolean;
} {
  return useAdminEnvironment();
}
