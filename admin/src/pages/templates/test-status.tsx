import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@components/ui/dropdown-menu';
import { Input } from '@components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { AdminLayout } from '@admin/admin-layout';
import { type ResourceRow } from '@admin/resource-config';
import { fetchResourceRecord, updateRow, useResourceRows } from '@admin/use-resource-data';
import { approveTemplateMetadata, getApprovalTimestamp, isTemplateApproved } from '@utils/template-metadata';
import { useLocalStorage } from '@utils/use-localstorage.hook';
import dayjs from 'dayjs';
import { Loader2, Search, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import * as React from 'react';
import { toast } from 'sonner';

export const getServerSideProps: GetServerSideProps = async () => ({ props: {} });

const COLUMN_STORAGE_KEY = 'draken-admin:templates:test-status:columns';
const FILTER_STORAGE_KEY = 'draken-admin:templates:test-status:filters';

const columns = [
  { key: 'name', label: 'Mall' },
  { key: 'identifier', label: 'Identifierare' },
  { key: 'version', label: 'Version' },
  { key: 'status', label: 'Teststatus' },
  { key: 'approvedAt', label: 'Godkänd' },
  { key: 'actions', label: 'Åtgärder', align: 'right' },
] as const;

type ColumnKey = (typeof columns)[number]['key'];
type ColumnVisibility = Record<ColumnKey, boolean>;
type StatusFilter = 'all' | 'approved' | 'unapproved';

const defaultColumnVisibility = Object.fromEntries(columns.map((column) => [column.key, true])) as ColumnVisibility;

interface SavedFilters {
  status?: StatusFilter;
  version?: string;
}

function asJsonString(value: unknown, fallback: unknown): string {
  if (typeof value === 'string') return value;
  return JSON.stringify(value ?? fallback, null, 2);
}

function formatApprovedAt(value: string | undefined): string {
  if (!value) return '—';
  const date = dayjs(value);
  return date.isValid() ? date.format('YYYY-MM-DD HH:mm:ss') : '—';
}

function textValue(value: unknown): string {
  return value == null ? '' : String(value);
}

export default function TemplateTestStatus() {
  const router = useRouter();
  const municipalityId = useLocalStorage((s) => s.municipalityId);
  const { rows, loading, refresh } = useResourceRows('templates');
  const [approvingIdentifier, setApprovingIdentifier] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all');
  const [versionFilter, setVersionFilter] = React.useState('all');
  const [columnVisibility, setColumnVisibility] = React.useState<ColumnVisibility>(defaultColumnVisibility);
  const [columnSettingsLoaded, setColumnSettingsLoaded] = React.useState(false);
  const [filterSettingsLoaded, setFilterSettingsLoaded] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(COLUMN_STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<ColumnVisibility>;
        setColumnVisibility({ ...defaultColumnVisibility, ...saved });
      }
    } catch {
      /* Ignore invalid stored preferences and keep defaults. */
    } finally {
      setColumnSettingsLoaded(true);
    }
  }, []);

  React.useEffect(() => {
    if (!columnSettingsLoaded) return;
    window.localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(columnVisibility));
  }, [columnSettingsLoaded, columnVisibility]);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(FILTER_STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as SavedFilters;
        if (saved.status === 'all' || saved.status === 'approved' || saved.status === 'unapproved') {
          setStatusFilter(saved.status);
        }
        if (saved.version) setVersionFilter(saved.version);
      }
    } catch {
      /* Ignore invalid stored preferences and keep defaults. */
    } finally {
      setFilterSettingsLoaded(true);
    }
  }, []);

  React.useEffect(() => {
    if (!filterSettingsLoaded) return;
    window.localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify({ status: statusFilter, version: versionFilter }));
  }, [filterSettingsLoaded, statusFilter, versionFilter]);

  const visibleColumns = columns.filter((column) => columnVisibility[column.key]);
  const visibleColumnCount = visibleColumns.length || 1;
  const versions = React.useMemo(
    () => Array.from(new Set(rows.map((row) => textValue(row.version)).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'sv-SE', { numeric: true })),
    [rows]
  );

  const filteredRows = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return rows.filter((row) => {
      const approved = isTemplateApproved(row.metadata);
      const approvedAt = getApprovalTimestamp(row.metadata);
      const statusText = approved ? 'godkänd för produktion' : 'ej godkänd';
      const version = textValue(row.version);

      if (statusFilter === 'approved' && !approved) return false;
      if (statusFilter === 'unapproved' && approved) return false;
      if (versionFilter !== 'all' && version !== versionFilter) return false;
      if (!query) return true;

      return [
        row.name,
        row.identifier,
        version ? `v${version}` : '',
        version,
        statusText,
        formatApprovedAt(approvedAt),
      ].some((value) => textValue(value).toLowerCase().includes(query));
    });
  }, [rows, searchQuery, statusFilter, versionFilter]);

  const toggleColumn = (key: ColumnKey, visible: boolean) => {
    setColumnVisibility((current) => ({ ...current, [key]: visible }));
  };

  const onlyUnapproved = statusFilter === 'unapproved';

  const openTemplate = (identifier: unknown) => {
    if (!identifier) return;
    router.push(`/templates/${encodeURIComponent(String(identifier))}`);
  };

  const approveTemplate = async (event: React.MouseEvent<HTMLButtonElement>, row: ResourceRow) => {
    event.stopPropagation();
    const identifier = String(row.identifier ?? '');
    if (!identifier) {
      toast.error('Mallen saknar identifierare.');
      return;
    }

    setApprovingIdentifier(identifier);
    try {
      const template = await fetchResourceRecord('templates', municipalityId, identifier);
      if (!template) throw new Error('not-found');

      await updateRow('templates', municipalityId, template, {
        identifier,
        name: template.name ?? row.name ?? identifier,
        description: template.description ?? '',
        content: template.content ?? '',
        metadata: JSON.stringify(approveTemplateMetadata(template.metadata), null, 2),
        defaultValues: asJsonString(template.defaultValues, []),
        versionIncrement: 'MINOR',
        changeLog: '',
      });

      toast.success(`${template.name ?? identifier} godkändes för produktion.`);
      refresh();
    } catch {
      toast.error(`Kunde inte godkänna ${identifier}.`);
    } finally {
      setApprovingIdentifier(null);
    }
  };

  return (
    <AdminLayout title="Teststatus" breadcrumb="Mallar">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[16rem] max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Sök mall..."
            className="pl-9"
          />
        </div>

        <Button
          type="button"
          variant={onlyUnapproved ? 'secondary' : 'outline'}
          size="sm"
          aria-pressed={onlyUnapproved}
          onClick={() => setStatusFilter(onlyUnapproved ? 'all' : 'unapproved')}
        >
          Ej godkända
        </Button>

        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
          <SelectTrigger className="w-[12rem]" aria-label="Filtrera på teststatus">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alla statusar</SelectItem>
            <SelectItem value="approved">Godkända</SelectItem>
            <SelectItem value="unapproved">Ej godkända</SelectItem>
          </SelectContent>
        </Select>

        <Select value={versionFilter} onValueChange={setVersionFilter}>
          <SelectTrigger className="w-[10rem]" aria-label="Filtrera på version">
            <SelectValue placeholder="Alla versioner" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alla versioner</SelectItem>
            {versions.map((version) => (
              <SelectItem key={version} value={version}>
                v{version}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <SlidersHorizontal className="size-4" />
                Kolumner
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Visa kolumner</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {columns.map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.key}
                  checked={columnVisibility[column.key]}
                  disabled={columnVisibility[column.key] && visibleColumns.length === 1}
                  onCheckedChange={(value) => toggleColumn(column.key, !!value)}
                  onSelect={(event) => event.preventDefault()}
                >
                  {column.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {visibleColumns.map((column) => (
                <TableHead key={column.key} className={'align' in column && column.align === 'right' ? 'text-right' : undefined}>
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColumnCount} className="h-24 text-center text-muted-foreground">
                  {loading ? 'Hämtar…' : rows.length === 0 ? 'Inga mallar.' : 'Inga mallar matchar filtren.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredRows.map((t) => {
                const approved = isTemplateApproved(t.metadata);
                const approvedAt = getApprovalTimestamp(t.metadata);
                const identifier = String(t.identifier ?? '');
                const approving = approvingIdentifier === identifier;
                return (
                  <TableRow
                    key={t.__key}
                    role="button"
                    tabIndex={0}
                    className="cursor-pointer"
                    onClick={() => openTemplate(t.identifier)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        openTemplate(t.identifier);
                      }
                    }}
                  >
                    {columnVisibility.name && <TableCell className="font-medium">{String(t.name ?? t.identifier)}</TableCell>}
                    {columnVisibility.identifier && <TableCell className="text-muted-foreground">{String(t.identifier)}</TableCell>}
                    {columnVisibility.version && <TableCell className="text-muted-foreground">{t.version != null ? `v${t.version}` : '—'}</TableCell>}
                    {columnVisibility.status && (
                      <TableCell>
                        {approved ? (
                          <Badge>Godkänd för produktion</Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Ej godkänd
                          </Badge>
                        )}
                      </TableCell>
                    )}
                    {columnVisibility.approvedAt && (
                      <TableCell className="font-mono text-xs text-muted-foreground">{formatApprovedAt(approvedAt)}</TableCell>
                    )}
                    {columnVisibility.actions && (
                      <TableCell className="text-right">
                        {!approved && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={approving}
                            onKeyDown={(event) => event.stopPropagation()}
                            onPointerDown={(event) => event.stopPropagation()}
                            onClick={(event) => approveTemplate(event, t)}
                          >
                            {approving ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
                            Godkänn
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
}
