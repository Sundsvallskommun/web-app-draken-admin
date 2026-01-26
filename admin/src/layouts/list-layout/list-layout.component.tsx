import { ListToolbar } from '@components/list-toolbar/list-toolbar';
import { Api } from '@data-contracts/backend/Api';
import { Namespace } from '@data-contracts/backend/data-contracts';
import { ResourceName } from '@interfaces/resource-name';
import DefaultLayout from '@layouts/default-layout/default-layout.component';
import { Header } from '@layouts/header/header.component';
import Main from '@layouts/main/main.component';
import { FormControl, FormLabel, Link, Select, Spinner } from '@sk-web-gui/react';
import { useLocalStorage } from '@utils/use-localstorage.hook';
import { useResource } from '@utils/use-resource';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { capitalize } from 'underscore.string';

interface ListLayoutProp {
  resource: ResourceName;
  properties?: string[];
  children?: React.ReactNode;
  showFilter?: boolean;
}

export const ListLayout: React.FC<ListLayoutProp> = ({ resource, properties, children, showFilter }) => {
  const apiService = new Api({ baseURL: process.env.NEXT_PUBLIC_API_URL, withCredentials: true });
  const { t } = useTranslation();
  const router = useRouter();
  const { namespace: urlNamespace } = router.query;

  const { municipalityId, selectedNamespace, setSelectedNamespace } = useLocalStorage();

  // Use URL param if present, otherwise use saved namespace from store
  const activeNamespace = typeof urlNamespace === 'string' ? urlNamespace : selectedNamespace || undefined;
  const filter = activeNamespace ? { namespace: activeNamespace } : undefined;
  const { loading, refresh } = useResource(resource, filter);

  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    apiService.namespaceControllerGetNamespaces(municipalityId).then((res) => {
      setNamespaces(res.data.data);
      setIsLoaded(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [municipalityId]);

  useEffect(() => {
    if (showFilter && isLoaded) {
      if (activeNamespace && urlNamespace !== activeNamespace) {
        router.replace(
          {
            pathname: router.pathname,
            query: {
              ...router.query,
              namespace: activeNamespace,
            },
          },
          undefined,
          { shallow: true }
        );
      }
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, showFilter, activeNamespace]);

  useEffect(() => {
    if (!resource) {
      router.push('/');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource]);

  return (
    resource && (
      <DefaultLayout title={`${t(`${resource}:name_many`)} - ${process.env.NEXT_PUBLIC_APP_NAME}`}>
        <Main>
          <Header>
            <div className="relative flex items-center gap-36">
              <div className="flex flex-col">
                <h1 className="leading-h4-sm">{capitalize(t(`${resource}:name_many`))}</h1>
                {resource === 'featureFlags' && (
                  <Link
                    target="_blank"
                    href="https://confluence.sundsvall.se/pages/viewpage.action?pageId=1259405457&spaceKey=OA&title=Feature%2Bflaggor%2Balla%2Bdrakar"
                  >
                    Länk till dokumentation för flaggor
                  </Link>
                )}
              </div>
              <span className="flex items-center gap-16">
                {showFilter && isLoaded && (
                  <FormControl>
                    <FormLabel>{capitalize(t(`featureFlags:properties.namespace`))}</FormLabel>
                    <Select
                      value={activeNamespace ?? ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        setSelectedNamespace(value);

                        router.push(
                          {
                            pathname: router.pathname,
                            query: {
                              ...router.query,
                              namespace: value || undefined,
                            },
                          },
                          undefined,
                          { shallow: true }
                        );
                      }}
                    >
                      <Select.Option value={''}>Välj ett alternativ</Select.Option>
                      {namespaces?.map((namespace, index) => (
                        <Select.Option value={namespace.namespace} key={index}>
                          {namespace.displayName} ({namespace.namespace})
                        </Select.Option>
                      ))}
                    </Select>
                  </FormControl>
                )}
                {loading && <Spinner size={2.5} />}
              </span>
            </div>
            <ListToolbar resource={resource} onRefresh={refresh} properties={properties} />
          </Header>
          {children}
        </Main>
      </DefaultLayout>
    )
  );
};

export default ListLayout;
