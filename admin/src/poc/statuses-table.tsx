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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@components/ui/table';
import { type Status } from '@poc/poc-resources';
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

export function StatusesTable({ data }: { data: Status[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [filter, setFilter] = React.useState('');

  const columns = React.useMemo<ColumnDef<Status>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => <SortHeader column={column}>Namn</SortHeader>,
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      },
      {
        accessorKey: 'displayName',
        header: ({ column }) => <SortHeader column={column}>Visningsnamn</SortHeader>,
        cell: ({ row }) => row.original.displayName,
      },
      {
        accessorKey: 'externalDisplayName',
        header: 'Externt visningsnamn',
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.externalDisplayName}</span>,
      },
      {
        accessorKey: 'namespace',
        header: ({ column }) => <SortHeader column={column}>Namespace</SortHeader>,
        cell: ({ row }) => <Badge variant="secondary">{row.original.namespace}</Badge>,
      },
      {
        accessorKey: 'updatedAt',
        header: ({ column }) => <SortHeader column={column}>Uppdaterad</SortHeader>,
        cell: ({ row }) => <span className="text-muted-foreground tabular-nums">{row.original.updatedAt}</span>,
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Åtgärder</span>,
        cell: ({ row }) => {
          const status = row.original;
          return (
            <div className="flex justify-end gap-1">
              <Button asChild variant="ghost" size="icon" aria-label={`Redigera ${status.name}`}>
                <NextLink href={`/poc/statuses/${status.namespace}__${status.id}`}>
                  <Pencil className="size-4" />
                </NextLink>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label={`Ta bort ${status.name}`}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Ta bort {status.name}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Detta går inte att ångra. Statusen tas bort från namespace {status.namespace}.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Avbryt</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => toast.success(`${status.name} togs bort (PoC – ingen riktig radering).`)}
                    >
                      Ta bort
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data,
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
  const showingAll = pageSize >= data.length;
  const pageSizeValue = showingAll ? 'all' : String(pageSize);
  const onPageSizeChange = (value: string) => {
    table.setPageSize(value === 'all' ? data.length : Number(value));
  };

  return (
    <div className="flex flex-col gap-4">
      <Input
        placeholder="Sök status…"
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
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
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
                  Inga statusar matchade sökningen.
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
          <span className="text-sm text-muted-foreground">
            av {table.getFilteredRowModel().rows.length} statusar
          </span>
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
