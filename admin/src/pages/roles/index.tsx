import { ListResources } from '@components/list-resources/list-resources';
import resources from '@config/resources';
import ListLayout from '@layouts/list-layout/list-layout.component';
import { useLocalStorage } from '@utils/use-localstorage.hook';
import { useResource } from '@utils/use-resource';
import { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export const Roles: React.FC = () => {
  const router = useRouter();
  const { namespace } = router.query;

  const { municipalityId } = useLocalStorage();

  const filter = typeof namespace === 'string' ? { namespace } : undefined;
  const resource = 'roles';

  const properties = ['name', 'displayName'];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, refresh, loaded } = useResource(resource, filter as any);
  
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [namespace, municipalityId]);

  return (
    resource && (
      <ListLayout resource={resource} properties={properties} showFilter>
        {loaded && <ListResources resource={resource} data={data} properties={properties} filter={filter?.namespace} editProperty='name'/>}
      </ListLayout>
    )
  );
};

export const getServerSideProps: GetServerSideProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale, ['common', 'layout', 'crud', ...Object.keys(resources)])),
  },
});

export default Roles;