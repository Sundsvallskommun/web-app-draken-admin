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
interface ResolvedEnvironment {
  state: AdminEnvironmentState;
  namespaceDeleteEnabled: boolean;
}

let cachedEnvironment: Promise<ResolvedEnvironment> | null = null;
const getAdminEnvironment = (): Promise<ResolvedEnvironment> => {
  if (!cachedEnvironment) {
    cachedEnvironment = fetchAdminEnvironment()
      .then((info) => ({
        state: adminEnvironmentFromKind(info.kind),
        namespaceDeleteEnabled: info.namespaceDeleteEnabled,
      }))
      .catch((err: unknown) => {
        // Drop the failed lookup so the next mount retries instead of staying stuck on "checking".
        cachedEnvironment = null;
        throw err;
      });
  }
  return cachedEnvironment;
};

export function useAdminEnvironment(): {
  environment: AdminEnvironmentState;
  isProduction: boolean;
  loaded: boolean;
  showTestFeatures: boolean;
  /** Backend switch NAMESPACE_DELETE_ENABLED; false until the environment has loaded. */
  namespaceDeleteEnabled: boolean;
} {
  const [environment, setEnvironment] = useState<AdminEnvironmentState>(checkingAdminEnvironment());
  const [namespaceDeleteEnabled, setNamespaceDeleteEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getAdminEnvironment()
      .then((resolved) => {
        if (cancelled) return;
        setEnvironment(resolved.state);
        setNamespaceDeleteEnabled(resolved.namespaceDeleteEnabled);
      })
      .catch(() => {
        // Unknown environment is treated as production by shouldTreatAsProduction, so nothing to set here.
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
    namespaceDeleteEnabled,
  };
}

export function useIsProductionEnv(): {
  environment: AdminEnvironmentState;
  isProduction: boolean;
  loaded: boolean;
  showTestFeatures: boolean;
  namespaceDeleteEnabled: boolean;
} {
  return useAdminEnvironment();
}
