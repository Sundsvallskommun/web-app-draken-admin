import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { AdminLayout } from '@admin/admin-layout';
import { useResourceRecord, useResourceRows } from '@admin/use-resource-data';
import { Info } from 'lucide-react';
import type { GetServerSideProps } from 'next';
import * as React from 'react';

export const getServerSideProps: GetServerSideProps = async () => ({ props: {} });

export default function TemplateCompare() {
  const { rows } = useResourceRows('templates');
  const [selected, setSelected] = React.useState('');
  // Full content comes from getOne (the list omits it).
  const { row, loading } = useResourceRecord('templates', selected || undefined);

  return (
    <AdminLayout title="Jämför miljöer" breadcrumb="Mallar">
      <div className="flex flex-col gap-6">
        <Select value={selected} onValueChange={setSelected}>
          <SelectTrigger className="w-[24rem]" aria-label="Välj mall">
            <SelectValue placeholder="Välj mall" />
          </SelectTrigger>
          <SelectContent>
            {rows.map((t) => (
              <SelectItem key={t.__key} value={String(t.__key)}>
                {String(t.name ?? t.identifier)} ({String(t.identifier)})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
          <Info className="size-4 shrink-0" />
          Jämförelse mellan test- och produktionsmiljö kräver compare-tjänsten (ej kopplad i denna branch). Nedan visas
          mallens aktuella innehåll.
        </div>

        {selected && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Innehåll</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="overflow-auto rounded-md bg-muted p-4 font-mono text-sm">
                {loading ? 'Hämtar…' : String(row?.content ?? '')}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
