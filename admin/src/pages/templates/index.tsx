import { ListResources } from '@components/list-resources/list-resources';
import resources from '@config/resources';
import ListLayout from '@layouts/list-layout/list-layout.component';
import { useLocalStorage } from '@utils/use-localstorage.hook';
import { useResource } from '@utils/use-resource';
import { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export const Templates: React.FC = () => {
  const resource = 'templates';
  const properties = ['identifier', 'name', 'description', 'version'];

  const router = useRouter();
  const { namespace: urlNamespace } = router.query;
  const { selectedNamespace } = useLocalStorage();

  const activeNamespace = typeof urlNamespace === 'string' ? urlNamespace : selectedNamespace || undefined;
  const filter = activeNamespace ? { namespace: activeNamespace } : undefined;

  const { data, loaded, refresh } = useResource(resource, filter);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeNamespace]);

  return (
    resource && (
      <ListLayout resource={resource} properties={properties} showFilter>
        {loaded && <ListResources resource={resource} data={data} properties={properties} editProperty="identifier" />}
      </ListLayout>
    )
  );
};

export const getServerSideProps: GetServerSideProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale, ['common', 'layout', 'crud', ...Object.keys(resources)])),
  },
});

export default Templates;
