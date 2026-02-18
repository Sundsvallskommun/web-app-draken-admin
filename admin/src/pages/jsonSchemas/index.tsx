import { ListResources } from '@components/list-resources/list-resources';
import resources from '@config/resources';
import ListLayout from '@layouts/list-layout/list-layout.component';
import { useResource } from '@utils/use-resource';
import { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export const JsonSchemas: React.FC = () => {
  const resource = 'jsonSchemas';
  const properties = ['name', 'version', 'description', 'created'];

  const { data, loaded } = useResource(resource);

  return (
    resource && (
      <ListLayout resource={resource} properties={properties}>
        {loaded && <ListResources resource={resource} data={data} properties={properties} editProperty="id" />}
      </ListLayout>
    )
  );
};

export const getServerSideProps: GetServerSideProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale, ['common', 'layout', 'crud', 'jsonSchemas', ...Object.keys(resources)])),
  },
});

export default JsonSchemas;
