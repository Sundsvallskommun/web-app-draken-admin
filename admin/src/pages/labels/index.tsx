import { Input } from '@components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { LabelTree, type LabelNode } from '@poc/label-tree';
import { pocNamespaces } from '@poc/poc-resources';
import { usePocRows } from '@poc/use-poc-rows';
import { Loader2, Search, TriangleAlert } from 'lucide-react';
import type { GetServerSideProps } from 'next';
import { PocLayout } from '@poc/poc-layout';
import * as React from 'react';

export const getServerSideProps: GetServerSideProps = async () => ({ props: {} });

export default function PocLabels() {
  const [namespace, setNamespace] = React.useState(pocNamespaces[0].namespace);
  const [query, setQuery] = React.useState('');
  const { rows, loading, source, error } = usePocRows('labels', namespace);

  return (
    <PocLayout title="Etiketter" breadcrumb="Resurser">
      <div className="flex flex-col gap-4">
        {source !== 'api' && !loading && (
          <div className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
            <TriangleAlert className="size-4 shrink-0" />
            {error === '401'
              ? 'Inte inloggad mot backend – visar exempelträd. Logga in i vanliga admin (öppna /) för riktig data.'
              : `Kunde inte hämta från API:et (fel ${error}) – visar exempelträd.`}
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
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pocNamespaces.map((ns) => (
                <SelectItem key={ns.namespace} value={ns.namespace}>
                  {ns.displayName} ({ns.namespace})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {loading && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
        </div>

        <LabelTree data={rows as unknown as LabelNode[]} query={query} />
      </div>
    </PocLayout>
  );
}
