import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { Textarea } from '@components/ui/textarea';
import { PocLayout } from '@poc/poc-layout';
import { type PocRow } from '@poc/poc-resources';
import { SchemaBuilder } from '@poc/schema-builder';
import { createRow, updateRow, usePocRows } from '@poc/use-poc-rows';
import { useLocalStorage } from '@utils/use-localstorage.hook';
import { ArrowLeft } from 'lucide-react';
import type { GetServerSideProps } from 'next';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import * as React from 'react';
import { toast } from 'sonner';

export const getServerSideProps: GetServerSideProps = async () => ({ props: {} });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const errMsg = (e: any) => e?.response?.data?.message ?? e?.message ?? 'fel';

function Editor({ initial, isNew }: { initial?: PocRow; isNew: boolean }) {
  const router = useRouter();
  const municipalityId = useLocalStorage((s) => s.municipalityId);
  const [name, setName] = React.useState(String(initial?.name ?? ''));
  const [version, setVersion] = React.useState(String(initial?.version ?? '1.0'));
  const [description, setDescription] = React.useState(String(initial?.description ?? ''));
  const [value, setValue] = React.useState<object>({});

  const onSave = async () => {
    const data = { name, version, description, value };
    try {
      if (isNew) await createRow('jsonSchemas', municipalityId, data);
      else await updateRow('jsonSchemas', municipalityId, initial as PocRow, data);
      toast.success(`${isNew ? 'Skapade' : 'Sparade'} schema "${name}".`);
      router.push('/jsonSchemas');
    } catch (err) {
      toast.error(`Kunde inte spara: ${errMsg(err)}`);
    }
  };

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

      <SchemaBuilder value={initial?.value} onChange={setValue} />

      <div className="flex gap-3 border-t pt-6">
        <Button onClick={onSave}>{isNew ? 'Skapa' : 'Spara ändringar'}</Button>
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

  const initial = !isNew ? rows.find((r) => r.__key === rawId) : undefined;
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
