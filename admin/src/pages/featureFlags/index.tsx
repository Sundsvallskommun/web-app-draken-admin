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
import { ChevronRight, Flag, Loader2, Pencil, Plus, Search, TriangleAlert } from 'lucide-react';
import type { GetServerSideProps } from 'next';
import NextLink from 'next/link';
import * as React from 'react';

export const getServerSideProps: GetServerSideProps = async () => ({ props: {} });

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
      const status = activeCount === 0 ? 'inactive' : inactiveCount === 0 ? 'active' : 'partial';
      return {
        name,
        description: textValue(items.find((row) => row.description)?.description),
        rows: [...items].sort((a, b) => `${textValue(a.application)}:${textValue(a.namespace)}`.localeCompare(`${textValue(b.application)}:${textValue(b.namespace)}`, 'sv-SE')),
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
  if (group.status === 'active') return <Badge>Aktiv överallt</Badge>;
  if (group.status === 'inactive') {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Inaktiv överallt
      </Badge>
    );
  }
  return <Badge variant="secondary">Delvis aktiv</Badge>;
}

export default function FeatureFlagsPage() {
  const namespaceOptions = useNamespaces();
  const { rows, loading, error } = useResourceRows('featureFlags');
  const [query, setQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all');
  const [applicationFilter, setApplicationFilter] = React.useState('all');
  const [namespaceFilter, setNamespaceFilter] = React.useState('all');

  const groups = React.useMemo(() => groupRows(rows), [rows]);
  const applications = React.useMemo(
    () => Array.from(new Set(rows.map((row) => textValue(row.application)).filter(Boolean))).sort(),
    [rows]
  );

  const filteredGroups = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return groups.filter((group) => {
      if (statusFilter !== 'all' && group.status !== statusFilter) return false;
      if (applicationFilter !== 'all' && !group.rows.some((row) => textValue(row.application) === applicationFilter)) return false;
      if (namespaceFilter !== 'all' && !group.rows.some((row) => textValue(row.namespace) === namespaceFilter)) return false;
      if (!normalizedQuery) return true;

      return [
        group.name,
        group.description,
        ...group.applications,
        ...group.namespaces,
      ].some((value) => value.toLowerCase().includes(normalizedQuery));
    });
  }, [applicationFilter, groups, namespaceFilter, query, statusFilter]);

  const activeRows = rows.filter((row) => row.enabled === true).length;
  const partialGroups = groups.filter((group) => group.status === 'partial').length;

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
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Sök flagga..." className="pl-9" />
          </div>

          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
            <SelectTrigger className="w-[13rem]" aria-label="Filtrera på status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alla statusar</SelectItem>
              <SelectItem value="active">Aktiva överallt</SelectItem>
              <SelectItem value="inactive">Inaktiva överallt</SelectItem>
              <SelectItem value="partial">Delvis aktiva</SelectItem>
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

          {loading && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
        </div>

        <div className="flex flex-col gap-3">
          {filteredGroups.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-md border border-dashed py-12 text-center text-muted-foreground">
              <Flag className="size-6" />
              <p className="text-sm">{loading ? 'Hämtar...' : rows.length === 0 ? 'Inga feature-flaggor.' : 'Inga flaggor matchar filtren.'}</p>
            </div>
          ) : (
            filteredGroups.map((group) => (
              <Collapsible key={group.name} defaultOpen={group.status === 'partial'} className="rounded-md border bg-card">
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
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Applikation</TableHead>
                          <TableHead>Namespace</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Beskrivning</TableHead>
                          <TableHead className="text-right">Åtgärder</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.rows.map((row) => (
                          <TableRow key={row.__key}>
                            <TableCell className="font-medium">{textValue(row.application) || '-'}</TableCell>
                            <TableCell className="text-muted-foreground">{textValue(row.namespace) || '-'}</TableCell>
                            <TableCell>
                              {row.enabled ? (
                                <Badge>Aktiv</Badge>
                              ) : (
                                <Badge variant="outline" className="text-muted-foreground">
                                  Inaktiv
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="max-w-md truncate text-muted-foreground">{textValue(row.description)}</TableCell>
                            <TableCell className="text-right">
                              <Button asChild variant="ghost" size="icon" aria-label={`Redigera ${group.name}`}>
                                <NextLink href={`/featureFlags/${row.__key}`}>
                                  <Pencil className="size-4" />
                                </NextLink>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
