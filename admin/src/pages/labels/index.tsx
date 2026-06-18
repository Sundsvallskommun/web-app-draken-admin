import { Input } from '@components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { LabelTree, type LabelNode } from '@admin/label-tree';
import { AdminLayout } from '@admin/admin-layout';
import { useNamespaces } from '@admin/use-namespaces';
import { useResourceRows } from '@admin/use-resource-data';
import { Loader2, Search, TriangleAlert } from 'lucide-react';
import type { GetServerSideProps } from 'next';
import * as React from 'react';

export const getServerSideProps: GetServerSideProps = async () => ({ props: {} });

export default function LabelsPage() {
  const [namespace, setNamespace] = React.useState('');
  const [query, setQuery] = React.useState('');
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
          {loading && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
        </div>

        <LabelTree data={rows as unknown as LabelNode[]} query={query} />
      </div>
    </AdminLayout>
  );
}
