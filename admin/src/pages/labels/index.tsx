import { LabelsAdmin } from '@components/labels/labels-admin.component';
import resources from '@config/resources';
import ListLayout from '@layouts/list-layout/list-layout.component';
import { useLocalStorage } from '@utils/use-localstorage.hook';
import { useResource } from '@utils/use-resource';
import { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export const Labels: React.FC = () => {
  const router = useRouter();
  const { namespace: urlNamespace } = router.query;

  const { municipalityId, selectedNamespace } = useLocalStorage();

  const activeNamespace = typeof urlNamespace === 'string' ? urlNamespace : selectedNamespace || undefined;
  const filter = activeNamespace ? { namespace: activeNamespace } : undefined;
  const resource = 'labels';

  const properties = ['classification', 'displayName'];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { loaded, refresh } = useResource(resource, filter as any);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeNamespace, municipalityId]);

  return (
    resource && (
      <ListLayout resource={resource} properties={properties} showFilter>
        {loaded && activeNamespace && <LabelsAdmin namespace={activeNamespace} />}
      </ListLayout>
    )
  );
};

export const getServerSideProps: GetServerSideProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale, ['common', 'layout', 'crud', ...Object.keys(resources)])),
  },
});

export default Labels;
