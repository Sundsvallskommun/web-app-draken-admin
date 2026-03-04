import { ListResources } from '@components/list-resources/list-resources';
import { TemplateImportDialog } from '@components/template-import-dialog/template-import-dialog';
import resources from '@config/resources';
import ListLayout from '@layouts/list-layout/list-layout.component';
import { FormControl, FormLabel, Select } from '@sk-web-gui/react';
import { useCrudHelper } from '@utils/use-crud-helpers';
import { useLocalStorage } from '@utils/use-localstorage.hook';
import { useResource } from '@utils/use-resource';
import { getMetadataValue } from '@utils/template-metadata';
import { TemplateExport, TemplateImportData } from '@utils/template-export-import';
import { capitalize } from 'underscore.string';
import { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';

export const Templates: React.FC = () => {
  const resource = 'templates';
  const properties = ['identifier', 'name', 'description', 'templateType', 'version'];

  const router = useRouter();
  const { namespace: urlNamespace } = router.query;
  const { selectedNamespace } = useLocalStorage();

  const activeNamespace = typeof urlNamespace === 'string' ? urlNamespace : selectedNamespace || undefined;
  const filter = activeNamespace ? { namespace: activeNamespace } : undefined;

  const { data, loaded, refresh } = useResource(resource, filter);
  const { handleCreate } = useCrudHelper(resource);
  const { municipalityId } = useLocalStorage();
  const { create } = resources[resource];

  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importData, setImportData] = useState<TemplateExport | null>(null);
  const [selectedTemplateType, setSelectedTemplateType] = useState<string>('');

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeNamespace]);

  const enrichedData = useMemo(
    () =>
      data?.map((item) => ({
        ...item,
        templateType: (getMetadataValue(item.metadata, 'templateType') ?? '').toLowerCase(),
      })),
    [data]
  );

  const templateTypes = useMemo(() => {
    const types = new Set<string>();
    enrichedData?.forEach((item) => {
      if (item.templateType) {
        types.add(item.templateType);
      }
    });
    return Array.from(types).sort();
  }, [enrichedData]);

  const filteredData = useMemo(
    () =>
      selectedTemplateType ? enrichedData?.filter((item) => item.templateType === selectedTemplateType) : enrichedData,
    [enrichedData, selectedTemplateType]
  );

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

  const templateTypeFilter = (
    <FormControl>
      <FormLabel>Malltyp</FormLabel>
      <Select value={selectedTemplateType} onChange={(e) => setSelectedTemplateType(e.target.value)}>
        <Select.Option value="">Alla</Select.Option>
        {templateTypes.map((type) => (
          <Select.Option value={type} key={type}>
            {capitalize(type)}
          </Select.Option>
        ))}
      </Select>
    </FormControl>
  );

  return (
    resource && (
      <>
        <ListLayout
          resource={resource}
          properties={properties}
          showFilter
          extraFilters={templateTypeFilter}
          onImportTemplate={handleImportTemplate}
        >
          {loaded && (
            <ListResources
              resource={resource}
              data={filteredData}
              properties={properties}
              editProperty="identifier"
            />
          )}
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
