import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { LabelColumns } from '@admin/label-columns';
import { LabelTree, type LabelNode } from '@admin/label-tree';
import { AdminLayout } from '@admin/admin-layout';
import { useNamespaces } from '@admin/use-namespaces';
import { useResourceRows } from '@admin/use-resource-data';
import { cn } from '@utils/cn';
import { Columns3, ListTree, Loader2, Search, Tags, TriangleAlert } from 'lucide-react';
import type { GetServerSideProps } from 'next';
import * as React from 'react';

export const getServerSideProps: GetServerSideProps = async () => ({ props: {} });

type View = 'tree' | 'columns';

export default function LabelsPage() {
  const [namespace, setNamespace] = React.useState('');
  const [query, setQuery] = React.useState('');
  const [view, setView] = React.useState<View>('tree');
  const namespaceOptions = useNamespaces();
  const { rows, loading, error } = useResourceRows('labels', namespace || undefined);

  return (
    <AdminLayout title="Etiketter" breadcrumb="Resurser">
      <div className="flex flex-col gap-4">
        {error && !loading && (
          <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <TriangleAlert className="size-4 shrink-0" />
            {error === '401' ? 'Du är inte inloggad.' : `Kunde inte hämta data (fel ${error}).`}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Sök i trädet…"
              className="pl-9"
              disabled={!namespace}
            />
          </div>
          <Select value={namespace} onValueChange={setNamespace}>
            <SelectTrigger className="w-[16rem]" aria-label="Namespace">
              <SelectValue placeholder="Välj namespace" />
            </SelectTrigger>
            <SelectContent>
              {namespaceOptions.map((ns) => (
                <SelectItem key={ns.value} value={ns.value}>
                  {ns.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Visningsläge: träd eller macOS-liknande kolumnnavigering */}
          <div className="flex items-center rounded-md border p-0.5">
            <Button
              type="button"
              size="sm"
              variant={view === 'tree' ? 'secondary' : 'ghost'}
              className={cn('h-7 gap-1.5 px-2', view !== 'tree' && 'text-muted-foreground')}
              onClick={() => setView('tree')}
              aria-pressed={view === 'tree'}
            >
              <ListTree className="size-4" />
              Träd
            </Button>
            <Button
              type="button"
              size="sm"
              variant={view === 'columns' ? 'secondary' : 'ghost'}
              className={cn('h-7 gap-1.5 px-2', view !== 'columns' && 'text-muted-foreground')}
              onClick={() => setView('columns')}
              aria-pressed={view === 'columns'}
            >
              <Columns3 className="size-4" />
              Kolumner
            </Button>
          </div>

          {loading && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
        </div>

        {!namespace ? (
          <div className="flex flex-col items-center gap-2 rounded-md border border-dashed py-12 text-center text-muted-foreground">
            <Tags className="size-6" />
            <p className="text-sm">Välj ett namespace för att visa etiketter.</p>
          </div>
        ) : view === 'tree' ? (
          <LabelTree data={rows as unknown as LabelNode[]} query={query} />
        ) : (
          <LabelColumns data={rows as unknown as LabelNode[]} query={query} />
        )}
      </div>
    </AdminLayout>
  );
}
