import { CompareDiffDialog } from '@components/compare-diff-dialog/compare-diff-dialog';
import { CompareViewDialog } from '@components/compare-diff-dialog/compare-view-dialog';
import { CompareSyncDialog, SyncData, SyncType } from '@components/compare-sync-dialog/compare-sync-dialog';
import resources from '@config/resources';
import DefaultLayout from '@layouts/default-layout/default-layout.component';
import { Header } from '@layouts/header/header.component';
import Main from '@layouts/main/main.component';
import { CompareItem, CompareResult, checkCompareAvailable, fetchCompare } from '@services/compare-service';
import { getMetadataValue, TEST_STATUS_KEY, TEST_STATUS_APPROVED } from '@utils/template-metadata';
import { useCrudHelper } from '@utils/use-crud-helpers';
import { AutoTable, AutoTableHeader, Badge, Button, Disclosure, FormControl, FormLabel, Icon, Select, Spinner } from '@sk-web-gui/react';
import { useLocalStorage } from '@utils/use-localstorage.hook';
import { ArrowDownToLine, Eye } from 'lucide-react';
import { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { capitalize } from 'underscore.string';
import { useCallback, useEffect, useMemo, useState } from 'react';

const DIFF_FIELD_LABELS: Record<string, string> = {
  content: 'Innehåll',
  metadata: 'Metadata',
  defaultValues: 'Standardvärden',
};

const CompareSection: React.FC<{
  title: string;
  items: CompareItem[];
  variant: 'warning' | 'error' | 'tertiary';
  headers: AutoTableHeader[];
}> = ({ title, items, variant, headers }) => {
  if (items.length === 0) return null;

  const colorMap = {
    tertiary: 'text-tertiary',
    warning: 'text-warning',
    error: 'text-error',
  };

  return (
    <Disclosure initalOpen>
      <Disclosure.Header>
        <Disclosure.Title>
          <span className="flex items-center gap-8">
            <span className={colorMap[variant]}>{title}</span>
            <Badge color={variant} rounded>{items.length}</Badge>
          </span>
        </Disclosure.Title>
      </Disclosure.Header>
      <Disclosure.Content>
        <AutoTable
          dense
          pageSize={100}
          autodata={items}
          autoheaders={headers}
        />
      </Disclosure.Content>
    </Disclosure>
  );
};

export const TemplateCompare: React.FC = () => {
  const { municipalityId, selectedNamespace } = useLocalStorage();

  const [available, setAvailable] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CompareResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedDiff, setSelectedDiff] = useState<CompareItem | null>(null);
  const [selectedView, setSelectedView] = useState<CompareItem | null>(null);
  const [selectedTemplateType, setSelectedTemplateType] = useState<string>('');
  const [syncItem, setSyncItem] = useState<CompareItem | null>(null);
  const [syncType, setSyncType] = useState<SyncType>('create');
  const [syncing, setSyncing] = useState(false);
  const [syncedIdentifiers, setSyncedIdentifiers] = useState<Set<string>>(new Set());

  const isItemApproved = useCallback((item: CompareItem): boolean => {
    const meta = item.detail?.compareMetadata;
    if (!meta) return false;
    return getMetadataValue(meta, TEST_STATUS_KEY) === TEST_STATUS_APPROVED;
  }, []);

  const { handleCreate } = useCrudHelper('templates');

  useEffect(() => {
    checkCompareAvailable().then(setAvailable);
  }, []);

  const runCompare = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCompare('templates', municipalityId, selectedNamespace || undefined);
      setResult(data);
    } catch {
      setError('Kunde inte hämta jämförelsedata. Kontrollera att jämförelsemiljön är nåbar.');
    } finally {
      setLoading(false);
    }
  }, [municipalityId, selectedNamespace]);

  const openSyncDialog = useCallback((item: CompareItem, type: SyncType) => {
    setSyncItem(item);
    setSyncType(type);
  }, []);

  const handleSync = useCallback(async (data: SyncData) => {
    if (!resources.templates.create) return;
    setSyncing(true);
    try {
      const result = await handleCreate(() =>
        resources.templates.create!(municipalityId, {
          identifier: data.identifier,
          name: data.name,
          content: data.content,
          metadata: data.metadata,
          defaultValues: data.defaultValues,
          versionIncrement: data.versionIncrement,
          changeLog: data.changeLog,
        })
      );
      if (result) {
        setSyncedIdentifiers((prev) => new Set(prev).add(data.identifier));
        setSyncItem(null);
      }
    } finally {
      setSyncing(false);
    }
  }, [municipalityId, handleCreate]);

  const differentWithLabels = useMemo(
    () =>
      result?.different.map((item) => ({
        ...item,
        diffLabel: item.differences?.map((d) => DIFF_FIELD_LABELS[d] ?? d).join(', ') ?? '',
      })) ?? [],
    [result]
  );

  const allItems = useMemo(
    () => [
      ...(result?.missingLocally ?? []),
      ...(result?.missingInCompare ?? []),
      ...(result?.different ?? []),
    ],
    [result]
  );

  const templateTypes = useMemo(() => {
    const types = new Set<string>();
    allItems.forEach((item) => {
      if (item.templateType) types.add(item.templateType);
    });
    return Array.from(types).sort();
  }, [allItems]);

  const filterByType = useCallback(
    (items: CompareItem[]) =>
      selectedTemplateType ? items.filter((i) => i.templateType === selectedTemplateType) : items,
    [selectedTemplateType]
  );

  const filteredMissingLocally = useMemo(() => filterByType(result?.missingLocally ?? []), [result, filterByType]);
  const filteredMissingInCompare = useMemo(() => filterByType(result?.missingInCompare ?? []), [result, filterByType]);
  const filteredDifferent = useMemo(() => filterByType(differentWithLabels), [differentWithLabels, filterByType]);

  const totalDiffs = result
    ? filteredMissingLocally.length + filteredMissingInCompare.length + filteredDifferent.length
    : null;

  const missingLocallyHeaders: AutoTableHeader[] = [
    { label: 'Identifierare', property: 'identifier' },
    { label: 'Namn', property: 'name' },
    { label: 'Malltyp', property: 'templateType' },
    { label: 'Version (test)', property: 'compareVersion' },
    {
      label: 'Åtgärder',
      property: 'identifier',
      isColumnSortable: false,
      screenReaderOnly: true,
      renderColumn: (value: string) => {
        const item = result?.missingLocally.find((d) => d.identifier === value);
        const isSynced = syncedIdentifiers.has(value);
        return (
          <div className="text-right w-full flex items-center justify-end gap-4">
            {item && isItemApproved(item) && <Badge color="gronsta" rounded>Godkänd</Badge>}
            {isSynced && <Badge color="juniskar" rounded>Synkad</Badge>}
            {item?.detail && !isSynced && (
              <button onClick={() => openSyncDialog(item, 'create')} aria-label="Synkronisera mall">
                <Icon.Padded icon={<ArrowDownToLine />} variant="tertiary" className="link-btn" />
              </button>
            )}
            {item?.detail && (
              <button onClick={() => setSelectedView(item)} aria-label="Visa innehåll">
                <Icon.Padded icon={<Eye />} variant="tertiary" className="link-btn" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  const missingInCompareHeaders: AutoTableHeader[] = [
    { label: 'Identifierare', property: 'identifier' },
    { label: 'Namn', property: 'name' },
    { label: 'Malltyp', property: 'templateType' },
    { label: 'Version (produktion)', property: 'localVersion' },
  ];

  const differentHeaders: AutoTableHeader[] = [
    { label: 'Identifierare', property: 'identifier' },
    { label: 'Namn', property: 'name' },
    { label: 'Skillnader', property: 'diffLabel' },
    {
      label: 'Åtgärder',
      property: 'identifier',
      isColumnSortable: false,
      screenReaderOnly: true,
      renderColumn: (value: string) => {
        const item = result?.different.find((d) => d.identifier === value);
        const isSynced = syncedIdentifiers.has(value);
        return (
          <div className="text-right w-full flex items-center justify-end gap-4">
            {item && isItemApproved(item) && <Badge color="gronsta" rounded>Godkänd</Badge>}
            {isSynced && <Badge color="juniskar" rounded>Synkad</Badge>}
            {item?.detail && !isSynced && (
              <button onClick={() => openSyncDialog(item, 'update')} aria-label="Synkronisera mall">
                <Icon.Padded icon={<ArrowDownToLine />} variant="tertiary" className="link-btn" />
              </button>
            )}
            {item?.detail && (
              <button onClick={() => setSelectedDiff(item)} aria-label="Visa diff">
                <Icon.Padded icon={<Eye />} variant="tertiary" className="link-btn" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  if (available === null) {
    return (
      <DefaultLayout title={`Jämför miljöer - ${process.env.NEXT_PUBLIC_APP_NAME}`}>
        <Main>
          <div className="flex justify-center p-32">
            <Spinner size={3} />
          </div>
        </Main>
      </DefaultLayout>
    );
  }

  if (!available) {
    return (
      <DefaultLayout title={`Jämför miljöer - ${process.env.NEXT_PUBLIC_APP_NAME}`}>
        <Main>
          <Header>
            <h1>Jämför miljöer</h1>
          </Header>
          <div className="p-16">
            <p>Jämförelsefunktionen är inte konfigurerad för denna miljö.</p>
            <p className="mt-8 text-secondary">
              Sätt miljövariablerna <code>API_COMPARE_URL</code>, <code>CLIENT_KEY_COMPARE</code> och{' '}
              <code>CLIENT_SECRET_COMPARE</code> i backend för att aktivera.
            </p>
          </div>
        </Main>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout title={`Jämför miljöer - ${process.env.NEXT_PUBLIC_APP_NAME}`}>
      <Main>
        <Header>
          <div className="flex items-center gap-16">
            <h1>Jämför mallar mellan miljöer</h1>
            {selectedNamespace && (
              <Badge color="tertiary" rounded>
                {selectedNamespace}
              </Badge>
            )}
          </div>
        </Header>

        <div className="flex flex-col gap-16 p-16">
          <div className="flex items-end gap-16">
            <Button onClick={runCompare} disabled={loading}>
              {loading ? 'Jämför...' : 'Kör jämförelse'}
            </Button>
            {loading && <Spinner size={2} />}
            {result && templateTypes.length > 0 && (
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
          </div>

          <div className="text-small text-secondary flex flex-col gap-4">
            <p><strong>Saknas i produktion</strong> — Mallar som finns i testmiljön men inte i produktionsmiljön. Kan behöva skapas.</p>
            <p><strong>Saknas i test</strong> — Mallar som finns i produktionsmiljön men inte i testmiljön.</p>
            <p><strong>Skiljer sig</strong> — Samma mall finns i båda men med skillnader. Klicka på ögat för att se exakt diff.</p>
          </div>
          {error && <p className="text-error">{error}</p>}

          {result && totalDiffs === 0 && (
            <p className="text-success">Inga skillnader hittades. Miljöerna är synkade.</p>
          )}

          {result && (
            <>
              <CompareSection
                title="Saknas i produktion (finns i test)"
                items={filteredMissingLocally}
                variant="error"
                headers={missingLocallyHeaders}
              />
              <CompareSection
                title="Saknas i test (finns i produktion)"
                items={filteredMissingInCompare}
                variant="warning"
                headers={missingInCompareHeaders}
              />
              <CompareSection
                title="Finns i båda men skiljer sig"
                items={filteredDifferent}
                variant="warning"
                headers={differentHeaders}
              />
            </>
          )}

          {!result && !loading && (
            <p className="text-secondary">Tryck &quot;Kör jämförelse&quot; för att jämföra mallar mellan produktions- och testmiljön.</p>
          )}
        </div>
      </Main>

      {selectedDiff?.detail && (
        <CompareDiffDialog
          isOpen={!!selectedDiff}
          onClose={() => setSelectedDiff(null)}
          identifier={selectedDiff.identifier}
          detail={selectedDiff.detail}
          differences={selectedDiff.differences ?? []}
        />
      )}

      {selectedView?.detail && (
        <CompareViewDialog
          isOpen={!!selectedView}
          onClose={() => setSelectedView(null)}
          identifier={selectedView.identifier}
          detail={selectedView.detail}
        />
      )}

      <CompareSyncDialog
        isOpen={!!syncItem}
        onClose={() => setSyncItem(null)}
        onConfirm={handleSync}
        item={syncItem}
        syncType={syncType}
        syncing={syncing}
      />
    </DefaultLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale, ['common', 'layout', 'crud', ...Object.keys(resources)])),
  },
});

export default TemplateCompare;
