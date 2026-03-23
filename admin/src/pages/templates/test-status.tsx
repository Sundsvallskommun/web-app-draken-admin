import resources from '@config/resources';
import DefaultLayout from '@layouts/default-layout/default-layout.component';
import { Header } from '@layouts/header/header.component';
import Main from '@layouts/main/main.component';
import { Api } from '@data-contracts/backend/Api';
import { Namespace } from '@data-contracts/backend/data-contracts';
import { AutoTable, AutoTableHeader, Badge, Button, FormControl, FormLabel, Icon, Select, Spinner, useConfirm } from '@sk-web-gui/react';
import { useLocalStorage } from '@utils/use-localstorage.hook';
import { useResource } from '@utils/use-resource';
import { getMetadataValue, TEST_STATUS_KEY, TEST_APPROVED_AT_KEY, TEST_STATUS_APPROVED } from '@utils/template-metadata';
import { useCrudHelper } from '@utils/use-crud-helpers';
import { capitalize } from 'underscore.string';
import { Pencil, ShieldCheck } from 'lucide-react';
import NextLink from 'next/link';
import { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useState } from 'react';

type TestStatusFilter = '' | 'approved' | 'not_approved';

export const TemplateTestStatus: React.FC = () => {
  const resource = 'templates';
  const router = useRouter();
  const { namespace: urlNamespace } = router.query;
  const { municipalityId, selectedNamespace, setSelectedNamespace } = useLocalStorage();

  const activeNamespace = typeof urlNamespace === 'string' ? urlNamespace : selectedNamespace || undefined;
  const filter = activeNamespace ? { namespace: activeNamespace } : undefined;

  const { data, loaded, loading, refresh } = useResource(resource, filter);

  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  const [namespacesLoaded, setNamespacesLoaded] = useState(false);
  const [selectedTemplateType, setSelectedTemplateType] = useState<string>('');
  const [selectedTestStatus, setSelectedTestStatus] = useState<TestStatusFilter>('');
  const [approvingIdentifier, setApprovingIdentifier] = useState<string | null>(null);

  const confirm = useConfirm();
  const { handleUpdate } = useCrudHelper(resource);
  const { getOne, update } = resources[resource];

  const apiService = new Api({ baseURL: process.env.NEXT_PUBLIC_API_URL, withCredentials: true });

  useEffect(() => {
    apiService.namespaceControllerGetNamespaces(municipalityId).then((res) => {
      setNamespaces(res.data.data);
      setNamespacesLoaded(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [municipalityId]);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeNamespace]);

  const enrichedData = useMemo(
    () =>
      data?.map((item) => ({
        ...item,
        templateType: (getMetadataValue(item.metadata, 'templateType') ?? '').toLowerCase(),
        testStatus: getMetadataValue(item.metadata, TEST_STATUS_KEY) === TEST_STATUS_APPROVED ? 'approved' : 'not_approved',
      })),
    [data]
  );

  const templateTypes = useMemo(() => {
    const types = new Set<string>();
    enrichedData?.forEach((item) => {
      if (item.templateType) types.add(item.templateType);
    });
    return Array.from(types).sort();
  }, [enrichedData]);

  const filteredData = useMemo(() => {
    let result = enrichedData;
    if (selectedTemplateType) {
      result = result?.filter((item) => item.templateType === selectedTemplateType);
    }
    if (selectedTestStatus) {
      result = result?.filter((item) => item.testStatus === selectedTestStatus);
    }
    return result;
  }, [enrichedData, selectedTemplateType, selectedTestStatus]);

  const approvedCount = useMemo(() => enrichedData?.filter((i) => i.testStatus === 'approved').length ?? 0, [enrichedData]);
  const notApprovedCount = useMemo(() => enrichedData?.filter((i) => i.testStatus === 'not_approved').length ?? 0, [enrichedData]);

  const handleNamespaceChange = useCallback(
    (value: string) => {
      setSelectedNamespace(value);
      router.push(
        { pathname: router.pathname, query: { ...router.query, namespace: value || undefined } },
        undefined,
        { shallow: true }
      );
    },
    [router, setSelectedNamespace]
  );

  const handleApprove = useCallback(
    async (identifier: string) => {
      const confirmed = await confirm.showConfirmation(
        'Godkänn mall för produktion',
        `Vill du godkänna "${identifier}"? Mallen kommer att låsas för redigering.`,
        'Godkänn',
        'Avbryt',
        'info'
      );
      if (!confirmed || !getOne || !update) return;

      setApprovingIdentifier(identifier);
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const res = await getOne(municipalityId, identifier as any);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const template: any = res.data?.data ?? res.data;

        let metadataArray: Array<{ key: string; value: string }> = [];
        if (typeof template.metadata === 'string') {
          try { metadataArray = JSON.parse(template.metadata || '[]'); } catch { metadataArray = []; }
        } else if (Array.isArray(template.metadata)) {
          metadataArray = [...template.metadata];
        }

        const filtered = metadataArray.filter(
          (item) => item.key !== TEST_STATUS_KEY && item.key !== TEST_APPROVED_AT_KEY
        );
        filtered.push({ key: TEST_STATUS_KEY, value: TEST_STATUS_APPROVED });
        filtered.push({ key: TEST_APPROVED_AT_KEY, value: new Date().toISOString() });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await handleUpdate(() => update(municipalityId, identifier as any, {
          identifier: template.identifier,
          name: template.name,
          description: template.description,
          content: template.content,
          metadata: JSON.stringify(filtered, null, 2),
          defaultValues: template.defaultValues,
          versionIncrement: 'MINOR',
          changeLog: 'Godkänd för produktion',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any);

        refresh();
      } finally {
        setApprovingIdentifier(null);
      }
    },
    [municipalityId, getOne, update, confirm, handleUpdate, refresh]
  );

  const headers: AutoTableHeader[] = [
    { label: 'Identifierare', property: 'identifier' },
    { label: 'Namn', property: 'name' },
    { label: 'Malltyp', property: 'templateType' },
    { label: 'Version', property: 'version' },
    {
      label: 'Teststatus',
      property: 'testStatus',
      renderColumn: (value: string) =>
        value === 'approved' ?
          <Badge color="gronsta" rounded>Godkänd</Badge>
        : <Badge color="warning" rounded>Ej godkänd</Badge>,
    },
    {
      label: 'Åtgärder',
      property: 'identifier',
      isColumnSortable: false,
      screenReaderOnly: true,
      renderColumn: (value: string) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const item = filteredData?.find((d: any) => d.identifier === value);
        const isApproving = approvingIdentifier === value;
        return (
          <div className="text-right w-full flex items-center justify-end gap-4">
            {item?.testStatus === 'not_approved' && (
              <Button
                size="sm"
                variant="tertiary"
                color="gronsta"
                leftIcon={isApproving ? <Spinner size={1.5} /> : <ShieldCheck />}
                disabled={isApproving}
                onClick={() => handleApprove(value)}
              >
                {isApproving ? 'Godkänner...' : 'Godkänn'}
              </Button>
            )}
            <NextLink href={`/templates/${value}`} aria-label="Redigera">
              <Icon.Padded icon={<Pencil />} variant="tertiary" className="link-btn" />
            </NextLink>
          </div>
        );
      },
    },
  ];

  return (
    <DefaultLayout title={`Teststatus mallar - ${process.env.NEXT_PUBLIC_APP_NAME}`}>
      <Main>
        <Header>
          <div className="relative flex items-center gap-36">
            <h1 className="leading-h4-sm">Teststatus mallar</h1>
            <span className="flex items-center gap-16">
              {namespacesLoaded && (
                <FormControl>
                  <FormLabel>Namespace</FormLabel>
                  <Select
                    value={activeNamespace ?? ''}
                    onChange={(e) => handleNamespaceChange(e.target.value)}
                  >
                    <Select.Option value="">Välj ett alternativ</Select.Option>
                    {namespaces.map((ns, idx) => (
                      <Select.Option value={ns.namespace} key={idx}>
                        {ns.displayName} ({ns.namespace})
                      </Select.Option>
                    ))}
                  </Select>
                </FormControl>
              )}
              <FormControl>
                <FormLabel>Teststatus</FormLabel>
                <Select value={selectedTestStatus} onChange={(e) => setSelectedTestStatus(e.target.value as TestStatusFilter)}>
                  <Select.Option value="">Alla ({enrichedData?.length ?? 0})</Select.Option>
                  <Select.Option value="not_approved">Ej godkänd ({notApprovedCount})</Select.Option>
                  <Select.Option value="approved">Godkänd ({approvedCount})</Select.Option>
                </Select>
              </FormControl>
              {templateTypes.length > 0 && (
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
              )}
              {loading && <Spinner size={2.5} />}
            </span>
          </div>
        </Header>

        <div className="p-0">
          {loaded && filteredData && filteredData.length > 0 ?
            <AutoTable
              pageSize={25}
              autodata={filteredData}
              autoheaders={headers}
            />
          : loaded ?
            <p className="p-16 text-secondary">Inga mallar hittades.</p>
          : null}
        </div>
      </Main>
    </DefaultLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale, ['common', 'layout', 'crud', ...Object.keys(resources)])),
  },
});

export default TemplateTestStatus;
