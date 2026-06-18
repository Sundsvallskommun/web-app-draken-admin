import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@components/ui/alert-dialog';
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
import { type FieldDef, type PocResource, type PocRow } from '@poc/poc-resources';
import { removeRow, usePocRows } from '@poc/use-poc-rows';
import { useLocalStorage } from '@utils/use-localstorage.hook';
import {
  type ColumnDef,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ArrowUpDown, Loader2, Pencil, RefreshCcw, SlidersHorizontal, Trash2, TriangleAlert } from 'lucide-react';
import NextLink from 'next/link';
import * as React from 'react';
import { toast } from 'sonner';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SortHeader({ column, children }: { column: any; children: React.ReactNode }) {
  return (
    <Button
      variant="ghost"
      className="-ml-3 h-8 data-[state=open]:bg-accent"
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
    >
      {children}
      <ArrowUpDown className="ml-2 size-3.5 opacity-60" />
    </Button>
  );
}

function renderCell(field: FieldDef, value: unknown, emphasize: boolean) {
  if (field.type === 'switch') {
    return value ? (
      <Badge>Ja</Badge>
    ) : (
      <Badge variant="outline" className="text-muted-foreground">
        Nej
      </Badge>
    );
  }
  if (field.type === 'select') {
    return value ? <Badge variant="secondary">{String(value)}</Badge> : null;
  }
  const text = value == null ? '' : String(value);
  if (emphasize) return <span className="font-medium">{text}</span>;
  return <span className="text-muted-foreground">{text}</span>;
}

export function ResourceTable({ resource }: { resource: PocResource }) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [filter, setFilter] = React.useState('');
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [namespace, setNamespace] = React.useState('');

  const { rows, loading, source, error, refresh } = usePocRows(resource.name, namespace || undefined);
  const municipalityId = useLocalStorage((s) => s.municipalityId);

  // Keep delete handlers (created inside the columns memo) reading fresh values.
  const ctx = React.useRef({ live: false, municipalityId, refresh });
  ctx.current = { live: source === 'api', municipalityId, refresh };

  const tableFields = resource.fields.filter((f) => f.inTable);
  const hasActions = !resource.readOnly;
  const labelByKey = React.useMemo(
    () => Object.fromEntries(tableFields.map((f) => [f.key, f.label])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [resource.name]
  );

  const namespaceField = resource.fields.find((f) => f.key === 'namespace' && f.type === 'select');

  const columns = React.useMemo<ColumnDef<PocRow>[]>(() => {
    const cols: ColumnDef<PocRow>[] = tableFields.map((field, index) => ({
      accessorKey: field.key,
      header: ({ column }) => <SortHeader column={column}>{field.label}</SortHeader>,
      cell: ({ row }) => renderCell(field, row.original[field.key], index === 0),
    }));

    if (hasActions) {
      cols.push({
        id: 'actions',
        enableHiding: false,
        header: () => <span className="sr-only">Åtgärder</span>,
        cell: ({ row }) => {
          const item = row.original;
          const title = String(item[tableFields[0]?.key ?? 'id'] ?? item.id);
          return (
            <div className="flex justify-end gap-1">
              <Button asChild variant="ghost" size="icon" aria-label={`Redigera ${title}`}>
                <NextLink href={`/${resource.name}/${item.__key}`}>
                  <Pencil className="size-4" />
                </NextLink>
              </Button>
              {resource.canRemove && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label={`Ta bort ${title}`}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Ta bort {title}?</AlertDialogTitle>
                      <AlertDialogDescription>Detta går inte att ångra.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Avbryt</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={async () => {
                          if (!ctx.current.live) {
                            toast.success(`${title} togs bort (exempeldata – ingen riktig radering).`);
                            return;
                          }
                          try {
                            await removeRow(resource.name, ctx.current.municipalityId, item);
                            toast.success(`${title} togs bort.`);
                            ctx.current.refresh();
                          } catch (err) {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            toast.error(`Kunde inte ta bort: ${(err as any)?.response?.data?.message ?? 'fel'}`);
                          }
                        }}
                      >
                        Ta bort
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          );
        },
      });
    }
    return cols;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource.name]);

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, globalFilter: filter, columnVisibility },
    onSortingChange: setSorting,
    onGlobalFilterChange: setFilter,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const pageSize = table.getState().pagination.pageSize;
  const pageSizeValue = ['10', '20', '50'].includes(String(pageSize)) ? String(pageSize) : 'all';
  const onPageSizeChange = (value: string) => table.setPageSize(value === 'all' ? rows.length || 1 : Number(value));

  const hideableColumns = table.getAllColumns().filter((c) => c.getCanHide());

  return (
    <div className="flex flex-col gap-4">
      {source !== 'api' && !loading && (
        <div className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          <TriangleAlert className="size-4 shrink-0" />
          {error === '401'
            ? 'Inte inloggad mot backend – visar exempeldata. Logga in i vanliga admin (öppna /) för riktig data.'
            : 'Kunde inte nå API:et – visar exempeldata.'}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Input placeholder="Sök…" value={filter} onChange={(e) => setFilter(e.target.value)} className="max-w-xs" />

        {namespaceField && (
          <Select value={namespace || 'all'} onValueChange={(v) => setNamespace(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-[16rem]" aria-label="Filtrera på namespace">
              <SelectValue placeholder="Alla namespace" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alla namespace</SelectItem>
              {namespaceField.options?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div className="ml-auto flex items-center gap-2">
          {loading && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
          <Button variant="outline" size="sm" onClick={() => refresh()}>
            <RefreshCcw className="size-4" />
            Uppdatera
          </Button>
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
              {hideableColumns.map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  onSelect={(e) => e.preventDefault()}
                >
                  {labelByKey[column.id] ?? column.id}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id} className={header.id === 'actions' ? 'text-right' : undefined}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={table.getVisibleFlatColumns().length} className="h-24 text-center text-muted-foreground">
                  {loading ? 'Hämtar…' : 'Inga rader.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Visa</span>
          <Select value={pageSizeValue} onValueChange={onPageSizeChange}>
            <SelectTrigger className="h-9 w-[5.5rem]" aria-label="Antal rader per sida">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="all">Alla</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">av {table.getFilteredRowModel().rows.length} rader</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            Föregående
          </Button>
          <span className="text-sm text-muted-foreground">
            Sida {table.getState().pagination.pageIndex + 1} av {table.getPageCount() || 1}
          </span>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Nästa
          </Button>
        </div>
      </div>
    </div>
  );
}
