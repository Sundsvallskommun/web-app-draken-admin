import { ListResources } from '@components/list-resources/list-resources';
import { ListToolbar } from '@components/list-toolbar/list-toolbar';
import resources from '@config/resources';
import { Api } from '@data-contracts/backend/Api';
import { Namespace } from '@data-contracts/backend/data-contracts';
import DefaultLayout from '@layouts/default-layout/default-layout.component';
import { Header } from '@layouts/header/header.component';
import Main from '@layouts/main/main.component';
import { FormControl, FormLabel, Link, Select, Spinner } from '@sk-web-gui/react';
import { useResource } from '@utils/use-resource';
import { GetServerSideProps } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { capitalize } from 'underscore.string';

export const FeatureFlags: React.FC = () => {
  const apiService = new Api({ baseURL: process.env.NEXT_PUBLIC_API_URL, withCredentials: true });
  const { t } = useTranslation();
  const router = useRouter();

  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    apiService.namespaceControllerGetNamespaces().then((res) => {
      setNamespaces(res.data.data);
      setIsLoaded(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { namespace } = router.query;

  const filter = typeof namespace === 'string' ? { namespace } : undefined;

  const resource = 'featureFlags';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, refresh, loaded, loading } = useResource(resource, filter as any);

  useEffect(() => {
    if (!resource) {
      router.push('/');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource]);

  const getProperties = () => {
    return data?.[0] ?
        Object.keys(data[0]).filter((key) => {
          const type = typeof data[0][key];
          return type === 'string' || type === 'number' || type === 'boolean';
        })
      : undefined;
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [namespace]);

  return (
    resource &&
    isLoaded && (
      <DefaultLayout title={`${capitalize(t(`${resource}:name_many`))} - ${process.env.NEXT_PUBLIC_APP_NAME}`}>
        <Main>
          <Header>
            <span className="flex flex-row gap-16">
              <h1 className="leading-h4-sm">{capitalize(t(`${resource}:name_many`))}</h1>
              {loading && <Spinner size={2.5} className="leading-h4-sm" />}
            </span>
            <ListToolbar resource={resource} onRefresh={refresh} properties={getProperties()} />
            <Link
              target="_blank"
              href="https://confluence.sundsvall.se/pages/viewpage.action?pageId=1259405457&spaceKey=OA&title=Feature%2Bflaggor%2Balla%2Bdrakar"
            >
              Länk till dokumentation för flaggor
            </Link>
          </Header>
          <FormControl>
            <FormLabel>{capitalize(t(`featureFlags:properties.namespace`))}</FormLabel>
            <Select
              className="mb-[1.2rem]"
              value={(namespace as string) ?? ''}
              onChange={(e) => {
                const value = e.target.value;
                console.log('value', value);

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
              {namespaces.map((namespace, index) => {
                return (
                  <Select.Option value={namespace.namespace} key={index}>
                    {namespace.displayName} ({namespace.namespace})
                  </Select.Option>
                );
              })}
            </Select>
          </FormControl>

          {loaded && <ListResources resource={resource} data={data} />}
        </Main>
      </DefaultLayout>
    )
  );
};

export const getServerSideProps: GetServerSideProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale, ['common', 'layout', 'crud', ...Object.keys(resources)])),
  },
});

export default FeatureFlags;
