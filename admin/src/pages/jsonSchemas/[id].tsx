import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { Textarea } from '@components/ui/textarea';
import { PocLayout } from '@poc/poc-layout';
import { type PocRow } from '@poc/poc-resources';
import { SchemaBuilder } from '@poc/schema-builder';
import { usePocRows } from '@poc/use-poc-rows';
import { ArrowLeft } from 'lucide-react';
import type { GetServerSideProps } from 'next';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import * as React from 'react';
import { toast } from 'sonner';

export const getServerSideProps: GetServerSideProps = async () => ({ props: {} });

function Editor({ initial, isNew }: { initial?: PocRow; isNew: boolean }) {
  const router = useRouter();
  const [name, setName] = React.useState(String(initial?.name ?? ''));
  const [version, setVersion] = React.useState(String(initial?.version ?? '1.0'));
  const [description, setDescription] = React.useState(String(initial?.description ?? ''));

  return (
    <div className="flex flex-col gap-6">
      <div className="grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label>Namn *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} disabled={!isNew} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Version *</Label>
          <Input value={version} onChange={(e) => setVersion(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label>Beskrivning</Label>
          <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
      </div>

      <SchemaBuilder value={initial?.value} />

      <div className="flex gap-3 border-t pt-6">
        <Button onClick={() => { toast.success(`${isNew ? 'Skapade' : 'Sparade'} schema "${name}" (skrivning ej kopplad ännu).`); router.push('/jsonSchemas'); }}>
          {isNew ? 'Skapa' : 'Spara ändringar'}
        </Button>
        <Button variant="outline" onClick={() => router.push('/jsonSchemas')}>
          Avbryt
        </Button>
      </div>
    </div>
  );
}

export default function PocJsonSchemaEdit() {
  const router = useRouter();
  const rawId = Array.isArray(router.query.id) ? router.query.id[0] : router.query.id;
  const isNew = rawId === 'new';
  const { rows, loading } = usePocRows('jsonSchemas');

  if (!router.isReady) {
    return (
      <PocLayout title="Laddar…" breadcrumb="JSON-scheman">
        {null}
      </PocLayout>
    );
  }

  const initial = !isNew ? rows.find((r) => r.id === rawId) : undefined;
  const title = isNew ? 'Skapa JSON-schema' : String(initial?.name ?? rawId ?? 'Redigera JSON-schema');

  return (
    <PocLayout
      title={title}
      breadcrumb="JSON-scheman"
      actions={
        <Button asChild variant="ghost" size="sm">
          <NextLink href="/jsonSchemas">
            <ArrowLeft className="size-4" />
            Tillbaka
          </NextLink>
        </Button>
      }
    >
      {!isNew && loading ? (
        <p className="text-muted-foreground">Hämtar…</p>
      ) : !isNew && !initial ? (
        <p className="text-muted-foreground">Hittade inget schema med id {rawId}.</p>
      ) : (
        <Editor initial={initial} isNew={isNew} />
      )}
    </PocLayout>
  );
}
