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
import { Input } from '@components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { type FieldDef, type PocResource, type PocRow } from '@poc/poc-resources';
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ArrowUpDown, Pencil, Trash2 } from 'lucide-react';
import NextLink from 'next/link';
import * as React from 'react';
import { toast } from 'sonner';

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

  const tableFields = resource.fields.filter((f) => f.inTable);
  const hasActions = !resource.readOnly;

  const columns = React.useMemo<ColumnDef<PocRow>[]>(() => {
    const cols: ColumnDef<PocRow>[] = tableFields.map((field, index) => ({
      accessorKey: field.key,
      header: ({ column }) => <SortHeader column={column}>{field.label}</SortHeader>,
      cell: ({ row }) => renderCell(field, row.original[field.key], index === 0),
    }));

    if (hasActions) {
      cols.push({
        id: 'actions',
        header: () => <span className="sr-only">Åtgärder</span>,
        cell: ({ row }) => {
          const item = row.original;
          const title = String(item[tableFields[0]?.key ?? 'id'] ?? item.id);
          return (
            <div className="flex justify-end gap-1">
              <Button asChild variant="ghost" size="icon" aria-label={`Redigera ${title}`}>
                <NextLink href={`/poc/${resource.name}/${item.id}`}>
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
                        onClick={() => toast.success(`${title} togs bort (PoC – ingen riktig radering).`)}
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
    data: resource.rows,
    columns,
    state: { sorting, globalFilter: filter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const pageSize = table.getState().pagination.pageSize;
  const pageSizeValue = ['10', '20', '50'].includes(String(pageSize)) ? String(pageSize) : 'all';
  const onPageSizeChange = (value: string) =>
    table.setPageSize(value === 'all' ? resource.rows.length : Number(value));

  return (
    <div className="flex flex-col gap-4">
      <Input
        placeholder="Sök…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="max-w-xs"
      />

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
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  Inga rader matchade sökningen.
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
