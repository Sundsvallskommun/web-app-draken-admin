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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { AdminLayout } from '@admin/admin-layout';
import { type ResourceRow } from '@admin/resource-config';
import { fetchResourceRecord, updateRow, useResourceRows } from '@admin/use-resource-data';
import { approveTemplateMetadata, getApprovalTimestamp, isTemplateApproved } from '@utils/template-metadata';
import { useIsProductionEnv } from '@utils/use-is-production-env.hook';
import { useLocalStorage } from '@utils/use-localstorage.hook';
import dayjs from 'dayjs';
import { Loader2, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import * as React from 'react';
import { toast } from 'sonner';

export const getServerSideProps: GetServerSideProps = async () => ({ props: {} });

const COLUMN_STORAGE_KEY = 'draken-admin:templates:test-status:columns';

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

const defaultColumnVisibility = Object.fromEntries(columns.map((column) => [column.key, true])) as ColumnVisibility;

function asJsonString(value: unknown, fallback: unknown): string {
  if (typeof value === 'string') return value;
  return JSON.stringify(value ?? fallback, null, 2);
}

function formatApprovedAt(value: string | undefined): string {
  if (!value) return '—';
  const date = dayjs(value);
  return date.isValid() ? date.format('YYYY-MM-DD HH:mm:ss') : '—';
}

export default function TemplateTestStatus() {
  const router = useRouter();
  const municipalityId = useLocalStorage((s) => s.municipalityId);
  const { showTestFeatures } = useIsProductionEnv();
  const { rows, loading, refresh } = useResourceRows('templates');
  const [approvingIdentifier, setApprovingIdentifier] = React.useState<string | null>(null);
  const [columnVisibility, setColumnVisibility] = React.useState<ColumnVisibility>(defaultColumnVisibility);
  const [columnSettingsLoaded, setColumnSettingsLoaded] = React.useState(false);

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

  const visibleColumns = columns.filter((column) => columnVisibility[column.key]);
  const visibleColumnCount = visibleColumns.length || 1;

  const toggleColumn = (key: ColumnKey, visible: boolean) => {
    setColumnVisibility((current) => ({ ...current, [key]: visible }));
  };

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
      <div className="mb-3 flex justify-end">
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
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColumnCount} className="h-24 text-center text-muted-foreground">
                  {loading ? 'Hämtar…' : 'Inga mallar.'}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((t) => {
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
                        {showTestFeatures && !approved && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={approving}
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
