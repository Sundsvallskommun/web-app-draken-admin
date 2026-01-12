import resources from '@config/resources';
import { FeatureFlag } from '@data-contracts/backend/data-contracts';
import { ResourceName } from '@interfaces/resource-name';
import { Template } from '@services/templating/templating-service';
import 'dotenv';
import { useCallback, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useCrudHelper } from './use-crud-helpers';
import { useLocalStorage } from './use-localstorage.hook';

export const useResource = <TFilter = undefined>(resource: ResourceName, filter?: TFilter) => {
  const [resourceData, setData, setLoaded, setLoading, municipalityId] = useLocalStorage(
    useShallow((state) => [state.resourceData, state.setData, state.setLoaded, state.setLoading, state.municipalityId])
  );

  const getMany = resources?.[resource]?.getMany;
  const { handleGetMany } = useCrudHelper(resource);

  const data = resourceData[resource]?.data ?? [];
  const loaded = resourceData[resource]?.loaded ?? false;
  const loading = resourceData[resource]?.loading ?? false;

  const refresh = useCallback(() => {
    if (getMany) {
      setLoading(resource, true);
      console.log('Fetching resource data for', resource, 'with filter', filter);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handleGetMany<Template | FeatureFlag>(() => getMany(municipalityId, filter as any))
        .then((res) => {
          if (res) {
            setData(resource, res);
            setLoaded(resource, true);
          }
          setLoading(resource, false);
        })
        .catch(() => setLoading(resource, false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource, filter, municipalityId]);

  useEffect(() => {
    if (!loaded || !resourceData) {
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource]);

  return { data, loaded, loading, refresh };
};
