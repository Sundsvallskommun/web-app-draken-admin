import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@components/ui/collapsible';
import { Input } from '@components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { AdminLayout } from '@admin/admin-layout';
import { type ResourceRow } from '@admin/resource-config';
import { useNamespaces } from '@admin/use-namespaces';
import { useResourceRows } from '@admin/use-resource-data';
import { ChevronRight, Flag, Layers3, List, Loader2, Pencil, Plus, Search, TriangleAlert } from 'lucide-react';
import type { GetServerSideProps } from 'next';
import NextLink from 'next/link';
import * as React from 'react';

export const getServerSideProps: GetServerSideProps = async () => ({ props: {} });

type ViewMode = 'flat' | 'grouped';
type StatusFilter = 'all' | 'active' | 'inactive' | 'partial';

interface FlagGroup {
  name: string;
  description: string;
  rows: ResourceRow[];
  applications: string[];
  namespaces: string[];
  activeCount: number;
  inactiveCount: number;
  totalCount: number;
  status: 'active' | 'inactive' | 'partial';
}

const textValue = (value: unknown) => (value == null ? '' : String(value));

function sortRows(rows: ResourceRow[]) {
  return [...rows].sort((a, b) =>
    `${textValue(a.name)}:${textValue(a.application)}:${textValue(a.namespace)}`.localeCompare(
      `${textValue(b.name)}:${textValue(b.application)}:${textValue(b.namespace)}`,
      'sv-SE'
    )
  );
}

function groupRows(rows: ResourceRow[]): FlagGroup[] {
  const groups = new Map<string, ResourceRow[]>();
  rows.forEach((row) => {
    const name = textValue(row.name) || textValue(row.id);
    groups.set(name, [...(groups.get(name) ?? []), row]);
  });

  return Array.from(groups.entries())
    .map(([name, items]) => {
      const activeCount = items.filter((row) => row.enabled === true).length;
      const totalCount = items.length;
      const inactiveCount = totalCount - activeCount;
      const status =
        activeCount === 0 ? 'inactive'
        : inactiveCount === 0 ? 'active'
        : 'partial';
      return {
        name,
        description: textValue(items.find((row) => row.description)?.description),
        rows: [...items].sort((a, b) =>
          `${textValue(a.application)}:${textValue(a.namespace)}`.localeCompare(
            `${textValue(b.application)}:${textValue(b.namespace)}`,
            'sv-SE'
          )
        ),
        applications: Array.from(new Set(items.map((row) => textValue(row.application)).filter(Boolean))).sort(),
        namespaces: Array.from(new Set(items.map((row) => textValue(row.namespace)).filter(Boolean))).sort(),
        activeCount,
        inactiveCount,
        totalCount,
        status,
      } satisfies FlagGroup;
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'sv-SE'));
}

function StatusBadge({ group }: { group: FlagGroup }) {
  if (group.status === 'active') return <Badge>Aktiv</Badge>;
  if (group.status === 'inactive') {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Inaktiv
      </Badge>
    );
  }
  return <Badge variant="secondary">Delvis aktiv</Badge>;
}

function EnabledBadge({ enabled }: { enabled: unknown }) {
  return enabled ?
      <Badge>Aktiv</Badge>
    : <Badge variant="outline" className="text-muted-foreground">
        Inaktiv
      </Badge>;
}

function FeatureFlagRowsTable({ rows, showName = false }: { rows: ResourceRow[]; showName?: boolean }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {showName && <TableHead>Namn</TableHead>}
          <TableHead>Applikation</TableHead>
          <TableHead>Namespace</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Beskrivning</TableHead>
          <TableHead className="text-right">Åtgärder</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => {
          const name = textValue(row.name) || textValue(row.id);
          return (
            <TableRow key={row.__key}>
              {showName && <TableCell className="font-medium">{name || '-'}</TableCell>}
              <TableCell className={showName ? undefined : 'font-medium'}>
                {textValue(row.application) || '-'}
              </TableCell>
              <TableCell className="text-muted-foreground">{textValue(row.namespace) || '-'}</TableCell>
              <TableCell>
                <EnabledBadge enabled={row.enabled} />
              </TableCell>
              <TableCell className="max-w-md truncate text-muted-foreground">{textValue(row.description)}</TableCell>
              <TableCell className="text-right">
                <Button asChild variant="ghost" size="icon" aria-label={`Redigera ${name}`}>
                  <NextLink href={`/featureFlags/${row.__key}`}>
                    <Pencil className="size-4" />
                  </NextLink>
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export default function FeatureFlagsPage() {
  const namespaceOptions = useNamespaces();
  const { rows, loading, error } = useResourceRows('featureFlags');
  const [query, setQuery] = React.useState('');
  const [viewMode, setViewMode] = React.useState<ViewMode>('flat');
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all');
  const [applicationFilter, setApplicationFilter] = React.useState('all');
  const [namespaceFilter, setNamespaceFilter] = React.useState('all');

  const groups = React.useMemo(() => groupRows(rows), [rows]);
  const applications = React.useMemo(
    () => Array.from(new Set(rows.map((row) => textValue(row.application)).filter(Boolean))).sort(),
    [rows]
  );

  React.useEffect(() => {
    if (viewMode === 'flat' && statusFilter === 'partial') {
      setStatusFilter('all');
    }
  }, [statusFilter, viewMode]);

  const filteredRows = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return sortRows(rows).filter((row) => {
      if (applicationFilter !== 'all' && textValue(row.application) !== applicationFilter) return false;
      if (namespaceFilter !== 'all' && textValue(row.namespace) !== namespaceFilter) return false;
      if (viewMode === 'flat' && statusFilter === 'active' && row.enabled !== true) return false;
      if (viewMode === 'flat' && statusFilter === 'inactive' && row.enabled === true) return false;
      if (!normalizedQuery) return true;

      return [row.name, row.description, row.application, row.namespace].some((value) =>
        textValue(value).toLowerCase().includes(normalizedQuery)
      );
    });
  }, [applicationFilter, namespaceFilter, query, rows, statusFilter, viewMode]);

  const filteredGroups = React.useMemo(() => {
    return groupRows(filteredRows).filter((group) => {
      if (statusFilter === 'all') return true;
      return group.status === statusFilter;
    });
  }, [filteredRows, statusFilter]);

  const activeRows = rows.filter((row) => row.enabled === true).length;
  const partialGroups = groups.filter((group) => group.status === 'partial').length;
  const hasMatches = viewMode === 'flat' ? filteredRows.length > 0 : filteredGroups.length > 0;
  const showFlatView = () => {
    setViewMode('flat');
    if (statusFilter === 'partial') setStatusFilter('all');
  };

  return (
    <AdminLayout
      title="Feature-flaggor"
      breadcrumb="Resurser"
      actions={
        <Button asChild size="sm">
          <NextLink href="/featureFlags/new">
            <Plus className="size-4" />
            Skapa
          </NextLink>
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        {error && !loading && (
          <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <TriangleAlert className="size-4 shrink-0" />
            {error === '401' ? 'Du är inte inloggad.' : `Kunde inte hämta data (fel ${error}).`}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border bg-muted/30 px-3 py-2">
            <p className="text-xs text-muted-foreground">Flaggor</p>
            <p className="text-lg font-semibold">{groups.length}</p>
          </div>
          <div className="rounded-md border bg-muted/30 px-3 py-2">
            <p className="text-xs text-muted-foreground">Aktiva instanser</p>
            <p className="text-lg font-semibold">
              {activeRows}/{rows.length}
            </p>
          </div>
          <div className="rounded-md border bg-muted/30 px-3 py-2">
            <p className="text-xs text-muted-foreground">Delvis aktiva flaggor</p>
            <p className="text-lg font-semibold">{partialGroups}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[16rem] max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Sök flagga..."
              className="pl-9"
            />
          </div>

          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
            <SelectTrigger className="w-[13rem]" aria-label="Filtrera på status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alla statusar</SelectItem>
              <SelectItem value="active">Aktiva</SelectItem>
              <SelectItem value="inactive">Inaktiva</SelectItem>
              {viewMode === 'grouped' && <SelectItem value="partial">Delvis aktiva</SelectItem>}
            </SelectContent>
          </Select>

          <Select value={applicationFilter} onValueChange={setApplicationFilter}>
            <SelectTrigger className="w-[13rem]" aria-label="Filtrera på applikation">
              <SelectValue placeholder="Alla applikationer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alla applikationer</SelectItem>
              {applications.map((application) => (
                <SelectItem key={application} value={application}>
                  {application}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={namespaceFilter} onValueChange={setNamespaceFilter}>
            <SelectTrigger className="w-[13rem]" aria-label="Filtrera på namespace">
              <SelectValue placeholder="Alla namespace" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alla namespace</SelectItem>
              {namespaceOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center rounded-md border p-0.5">
            <Button
              type="button"
              size="sm"
              variant={viewMode === 'flat' ? 'secondary' : 'ghost'}
              className="h-7 gap-1.5 px-2"
              onClick={showFlatView}
              aria-pressed={viewMode === 'flat'}
            >
              <List className="size-4" />
              Platt
            </Button>
            <Button
              type="button"
              size="sm"
              variant={viewMode === 'grouped' ? 'secondary' : 'ghost'}
              className="h-7 gap-1.5 px-2"
              onClick={() => setViewMode('grouped')}
              aria-pressed={viewMode === 'grouped'}
            >
              <Layers3 className="size-4" />
              Grupperat
            </Button>
          </div>

          {loading && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
        </div>

        <div className="flex flex-col gap-3">
          {!hasMatches ?
            <div className="flex flex-col items-center gap-2 rounded-md border border-dashed py-12 text-center text-muted-foreground">
              <Flag className="size-6" />
              <p className="text-sm">
                {loading ?
                  'Hämtar...'
                : rows.length === 0 ?
                  'Inga feature-flaggor.'
                : 'Inga flaggor matchar filtren.'}
              </p>
            </div>
          : viewMode === 'flat' ?
            <div className="rounded-md border bg-card">
              <FeatureFlagRowsTable rows={filteredRows} showName />
            </div>
          : filteredGroups.map((group) => (
              <Collapsible
                key={group.name}
                defaultOpen={group.status === 'partial'}
                className="rounded-md border bg-card"
              >
                <CollapsibleTrigger className="group flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-accent">
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{group.name}</span>
                      <StatusBadge group={group} />
                      <Badge variant="outline" className="text-muted-foreground">
                        {group.activeCount}/{group.totalCount} aktiva
                      </Badge>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{group.description || 'Ingen beskrivning'}</p>
                  </div>
                  <div className="hidden max-w-[35%] flex-wrap justify-end gap-1 md:flex">
                    {group.applications.map((application) => (
                      <Badge key={application} variant="secondary" className="max-w-40 truncate">
                        {application}
                      </Badge>
                    ))}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="border-t">
                    <FeatureFlagRowsTable rows={group.rows} />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))
          }
        </div>
      </div>
    </AdminLayout>
  );
}
