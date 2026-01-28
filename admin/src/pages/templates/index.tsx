import { ListResources } from '@components/list-resources/list-resources';
import { TemplateImportDialog } from '@components/template-import-dialog/template-import-dialog';
import resources from '@config/resources';
import ListLayout from '@layouts/list-layout/list-layout.component';
import { useCrudHelper } from '@utils/use-crud-helpers';
import { useLocalStorage } from '@utils/use-localstorage.hook';
import { useResource } from '@utils/use-resource';
import { TemplateExport, TemplateImportData } from '@utils/template-export-import';
import { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export const Templates: React.FC = () => {
  const resource = 'templates';
  const properties = ['identifier', 'name', 'description', 'version'];

  const router = useRouter();
  const { namespace } = router.query;
  const filter = typeof namespace === 'string' ? { namespace } : undefined;

  const { data, loaded, refresh } = useResource(resource, filter);
  const { handleCreate } = useCrudHelper(resource);
  const { municipalityId } = useLocalStorage();
  const { create } = resources[resource];

  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importData, setImportData] = useState<TemplateExport | null>(null);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [namespace]);

  const handleImportTemplate = (data: TemplateExport) => {
    setImportData(data);
    setImportDialogOpen(true);
  };

  const handleConfirmImport = async (data: TemplateImportData) => {
    if (create) {
      const result = await handleCreate(() => create(municipalityId, data));
      if (result) {
        setImportDialogOpen(false);
        setImportData(null);
        refresh();
      }
    }
  };

  return (
    resource && (
      <>
        <ListLayout resource={resource} properties={properties} showFilter onImportTemplate={handleImportTemplate}>
          {loaded && <ListResources resource={resource} data={data} properties={properties} editProperty="identifier" />}
        </ListLayout>

        <TemplateImportDialog
          isOpen={importDialogOpen}
          onClose={() => setImportDialogOpen(false)}
          onConfirm={handleConfirmImport}
          templateData={importData}
        />
      </>
    )
  );
};

export const getServerSideProps: GetServerSideProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale, ['common', 'layout', 'crud', ...Object.keys(resources)])),
  },
});

export default Templates;
