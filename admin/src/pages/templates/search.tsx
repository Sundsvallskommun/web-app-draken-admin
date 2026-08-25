import { Badge } from '@components/ui/badge';
import { Card } from '@components/ui/card';
import { Input } from '@components/ui/input';
import { AdminLayout } from '@admin/admin-layout';
import { useResourceRows } from '@admin/use-resource-data';
import { ArrowRight, Search } from 'lucide-react';
import type { GetServerSideProps } from 'next';
import NextLink from 'next/link';
import * as React from 'react';

export const getServerSideProps: GetServerSideProps = async () => ({ props: {} });

export default function TemplateSearch() {
  const { rows, loading } = useResourceRows('templates');
  const [q, setQ] = React.useState('');
  const term = q.trim().toLowerCase();
  const results = term
    ? rows.filter((t) => [t.identifier, t.name, t.description].some((v) => String(v ?? '').toLowerCase().includes(term)))
    : rows;

  return (
    <AdminLayout title="Sök efter mall" breadcrumb="Mallar">
      <div className="flex max-w-xl flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Sök på identifierare, namn eller beskrivning…"
            className="pl-9"
          />
        </div>

        <p className="text-sm text-muted-foreground">{loading ? 'Hämtar…' : `${results.length} mallar`}</p>

        <ul className="flex flex-col gap-2">
          {results.map((t) => (
            <li key={t.__key}>
              <NextLink href={`/templates/${t.__key}`}>
                <Card className="flex items-center justify-between p-4 transition-colors hover:border-primary">
                  <div className="flex flex-col">
                    <span className="font-medium">{String(t.name ?? t.identifier)}</span>
                    <span className="text-sm text-muted-foreground">{String(t.identifier)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {t.version != null && <Badge variant="secondary">v{String(t.version)}</Badge>}
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </div>
                </Card>
              </NextLink>
            </li>
          ))}
        </ul>
      </div>
    </AdminLayout>
  );
}
