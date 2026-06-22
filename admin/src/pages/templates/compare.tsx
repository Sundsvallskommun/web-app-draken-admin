import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { AdminLayout } from '@admin/admin-layout';
import { CompareDiffDialog } from '@admin/compare-diff-dialog';
import { CompareSyncDialog, type SyncData, type SyncType } from '@admin/compare-sync-dialog';
import { CompareViewDialog } from '@admin/compare-view-dialog';
import { useNamespaces } from '@admin/use-namespaces';
import { createRow } from '@admin/use-resource-data';
import { type CompareItem, type CompareResult, checkCompareAvailable, fetchCompare } from '@services/compare-service';
import { useLocalStorage } from '@utils/use-localstorage.hook';
import { ChevronRight, Eye, Info, Loader2, Send } from 'lucide-react';
import type { GetServerSideProps } from 'next';
import * as React from 'react';
import { toast } from 'sonner';

export const getServerSideProps: GetServerSideProps = async () => ({ props: {} });

const DIFF_FIELD_LABELS: Record<string, string> = {
  content: 'Innehåll',
  metadata: 'Metadata',
  defaultValues: 'Standardvärden',
};

type Row = CompareItem & { diffLabel?: string };
interface Col {
  header: string;
  align?: 'right';
  cell: (item: Row) => React.ReactNode;
}

function CompareTable({ items, columns }: { items: Row[]; columns: Col[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((c, i) => (
            <TableHead key={i} className={c.align === 'right' ? 'text-right' : undefined}>
              {c.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.identifier}>
            {columns.map((c, i) => (
              <TableCell key={i} className={c.align === 'right' ? 'text-right' : undefined}>
                {c.cell(item)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function Section({
  title,
  count,
  countVariant,
  children,
}: {
  title: string;
  count: number;
  countVariant: 'default' | 'secondary' | 'destructive';
  children: React.ReactNode;
}) {
  if (count === 0) return null;
  return (
    <Collapsible defaultOpen className="rounded-md border">
      <CollapsibleTrigger className="group flex w-full items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-accent">
        <ChevronRight className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
        <span className="font-medium">{title}</span>
        <Badge variant={countVariant} className="ml-1">
          {count}
        </Badge>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border-t">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function TemplateCompare() {
  const municipalityId = useLocalStorage((s) => s.municipalityId);
  const nsOptions = useNamespaces();

  const [available, setAvailable] = React.useState<boolean | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<CompareResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [namespace, setNamespace] = React.useState('');
  const [selectedType, setSelectedType] = React.useState('');

  const [selectedDiff, setSelectedDiff] = React.useState<CompareItem | null>(null);
  const [selectedView, setSelectedView] = React.useState<CompareItem | null>(null);
  const [syncItem, setSyncItem] = React.useState<CompareItem | null>(null);
  const [syncType, setSyncType] = React.useState<SyncType>('create');
  const [syncing, setSyncing] = React.useState(false);
  const [syncedIds, setSyncedIds] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    checkCompareAvailable().then(setAvailable);
  }, []);

  const runCompare = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCompare('templates', municipalityId, namespace || undefined);
      setResult(data);
    } catch {
      setError('Kunde inte hämta jämförelsedata. Kontrollera att jämförelsemiljön är nåbar.');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (data: SyncData) => {
    setSyncing(true);
    try {
      await createRow('templates', municipalityId, {
        identifier: data.identifier,
        name: data.name,
        content: data.content,
        metadata: data.metadata,
        defaultValues: data.defaultValues,
        versionIncrement: data.versionIncrement,
        changeLog: data.changeLog,
      });
      setSyncedIds((prev) => new Set(prev).add(data.identifier));
      setSyncItem(null);
      toast.success(`${data.identifier} synkroniserades till produktion.`);
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toast.error(`Kunde inte synkronisera: ${(e as any)?.response?.data?.message ?? 'fel'}`);
    } finally {
      setSyncing(false);
    }
  };

  const isApproved = (item: CompareItem) => item.testApproved === true;

  const byType = React.useCallback(
    (items: CompareItem[]) => (selectedType ? items.filter((i) => i.templateType === selectedType) : items),
    [selectedType]
  );

  const templateTypes = React.useMemo(() => {
    const all = [
      ...(result?.missingLocally ?? []),
      ...(result?.missingInCompare ?? []),
      ...(result?.different ?? []),
    ];
    return Array.from(new Set(all.map((i) => i.templateType).filter(Boolean) as string[])).sort();
  }, [result]);

  const missingLocally = byType(result?.missingLocally ?? []);
  const missingInCompare = byType(result?.missingInCompare ?? []);
  const different: Row[] = byType(result?.different ?? []).map((item) => ({
    ...item,
    diffLabel: item.differences?.map((d) => DIFF_FIELD_LABELS[d] ?? d).join(', ') ?? '',
  }));
  const totalDiffs = result ? missingLocally.length + missingInCompare.length + different.length : null;

  const statusBadges = (item: CompareItem) => (
    <>
      {isApproved(item) && (
        <Badge className="bg-emerald-600 hover:bg-emerald-600">Godkänd</Badge>
      )}
      {syncedIds.has(item.identifier) && <Badge variant="secondary">Synkad</Badge>}
    </>
  );

  const missingLocallyCols: Col[] = [
    { header: 'Identifierare', cell: (i) => <span className="font-medium">{i.identifier}</span> },
    { header: 'Namn', cell: (i) => <span className="text-muted-foreground">{i.name ?? '—'}</span> },
    { header: 'Malltyp', cell: (i) => <span className="text-muted-foreground">{i.templateType ?? '—'}</span> },
    { header: 'Version (test)', cell: (i) => <span className="text-muted-foreground">{i.compareVersion ?? '—'}</span> },
    {
      header: 'Åtgärder',
      align: 'right',
      cell: (i) => (
        <div className="flex items-center justify-end gap-1">
          {statusBadges(i)}
          {i.detail && !syncedIds.has(i.identifier) && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Synkronisera till produktion"
              title="Synkronisera till produktion"
              onClick={() => {
                setSyncType('create');
                setSyncItem(i);
              }}
            >
              <Send className="size-4" />
            </Button>
          )}
          {i.detail && (
            <Button variant="ghost" size="icon" aria-label="Visa innehåll" title="Visa innehåll" onClick={() => setSelectedView(i)}>
              <Eye className="size-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const missingInCompareCols: Col[] = [
    { header: 'Identifierare', cell: (i) => <span className="font-medium">{i.identifier}</span> },
    { header: 'Namn', cell: (i) => <span className="text-muted-foreground">{i.name ?? '—'}</span> },
    { header: 'Malltyp', cell: (i) => <span className="text-muted-foreground">{i.templateType ?? '—'}</span> },
    { header: 'Version (produktion)', cell: (i) => <span className="text-muted-foreground">{i.localVersion ?? '—'}</span> },
  ];

  const differentCols: Col[] = [
    { header: 'Identifierare', cell: (i) => <span className="font-medium">{i.identifier}</span> },
    { header: 'Namn', cell: (i) => <span className="text-muted-foreground">{i.name ?? '—'}</span> },
    { header: 'Skillnader', cell: (i) => <span className="text-muted-foreground">{i.diffLabel}</span> },
    {
      header: 'Åtgärder',
      align: 'right',
      cell: (i) => (
        <div className="flex items-center justify-end gap-1">
          {statusBadges(i)}
          {i.detail && !syncedIds.has(i.identifier) && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Synkronisera till produktion"
              title="Synkronisera till produktion"
              onClick={() => {
                setSyncType('update');
                setSyncItem(i);
              }}
            >
              <Send className="size-4" />
            </Button>
          )}
          {i.detail && (
            <Button variant="ghost" size="icon" aria-label="Visa diff" title="Visa diff" onClick={() => setSelectedDiff(i)}>
              <Eye className="size-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <AdminLayout title="Jämför miljöer" breadcrumb="Mallar">
      {available === null ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : !available ? (
        <div className="flex flex-col gap-2 rounded-md border bg-muted/40 p-4 text-sm">
          <p className="font-medium">Jämförelsefunktionen är inte konfigurerad för denna miljö.</p>
          <p className="text-muted-foreground">
            Sätt miljövariablerna <code className="rounded bg-muted px-1">API_COMPARE_URL</code>,{' '}
            <code className="rounded bg-muted px-1">CLIENT_KEY_COMPARE</code> och{' '}
            <code className="rounded bg-muted px-1">CLIENT_SECRET_COMPARE</code> i backend för att aktivera.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Select value={namespace || 'all'} onValueChange={(v) => setNamespace(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-[16rem]" aria-label="Filtrera på namespace">
                <SelectValue placeholder="Alla namespace" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla namespace</SelectItem>
                {nsOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={runCompare} disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              {loading ? 'Jämför…' : 'Kör jämförelse'}
            </Button>

            {result && templateTypes.length > 0 && (
              <Select value={selectedType || 'all'} onValueChange={(v) => setSelectedType(v === 'all' ? '' : v)}>
                <SelectTrigger className="w-[14rem]" aria-label="Filtrera på malltyp">
                  <SelectValue placeholder="Alla malltyper" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alla malltyper</SelectItem>
                  {templateTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex flex-col gap-1 rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-2 font-medium text-foreground">
              <Info className="size-4" /> Så läser du jämförelsen
            </span>
            <p>
              <strong>Saknas i produktion</strong> — finns i test men inte i produktion. Kan synkas in.
            </p>
            <p>
              <strong>Saknas i test</strong> — finns i produktion men inte i test.
            </p>
            <p>
              <strong>Skiljer sig</strong> — finns i båda men med skillnader. Klicka på ögat för exakt diff.
            </p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {result && totalDiffs === 0 && (
            <p className="text-sm text-emerald-600">Inga skillnader hittades. Miljöerna är synkade.</p>
          )}

          {!result && !loading && (
            <p className="text-sm text-muted-foreground">
              Tryck på <strong>Kör jämförelse</strong> för att jämföra mallar mellan produktions- och testmiljön.
            </p>
          )}

          {result && (
            <div className="flex flex-col gap-3">
              <Section title="Saknas i produktion (finns i test)" count={missingLocally.length} countVariant="destructive">
                <CompareTable items={missingLocally} columns={missingLocallyCols} />
              </Section>
              <Section title="Saknas i test (finns i produktion)" count={missingInCompare.length} countVariant="secondary">
                <CompareTable items={missingInCompare} columns={missingInCompareCols} />
              </Section>
              <Section title="Finns i båda men skiljer sig" count={different.length} countVariant="default">
                <CompareTable items={different} columns={differentCols} />
              </Section>
            </div>
          )}
        </div>
      )}

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
    </AdminLayout>
  );
}
