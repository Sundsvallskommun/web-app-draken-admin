import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/card';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { Textarea } from '@components/ui/textarea';
import { AdminLayout } from '@admin/admin-layout';
import { JsonSchemaPreview } from '@admin/json-schema-preview';
import { type ResourceRow } from '@admin/resource-config';
import { SchemaBuilder } from '@admin/schema-builder';
import { createRow, updateRow, useResourceRecord } from '@admin/use-resource-data';
import { JsonEditor } from '@components/json-editor/json-editor';
import { useLocalStorage } from '@utils/use-localstorage.hook';
import { cn } from '@utils/cn';
import { ArrowLeft, Braces, Eye, FileJson, LayoutTemplate, Save } from 'lucide-react';
import type { GetServerSideProps } from 'next';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import * as React from 'react';
import { toast } from 'sonner';

export const getServerSideProps: GetServerSideProps = async () => ({ props: {} });

type EditorMode = 'builder' | 'schema' | 'uiSchema';

const emptySchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  properties: {},
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const errMsg = (e: any) => e?.response?.data?.message ?? e?.message ?? 'fel';

function nextVersion(currentVersion: string, increment: 'MINOR' | 'MAJOR') {
  const [majorRaw, minorRaw] = currentVersion.split('.').map(Number);
  const major = Number.isFinite(majorRaw) ? majorRaw : 1;
  const minor = Number.isFinite(minorRaw) ? minorRaw : 0;
  return increment === 'MAJOR' ? `${major + 1}.0` : `${major}.${minor + 1}`;
}

function dataFromResponse(response: unknown): ResourceRow | undefined {
  const maybe = response as { data?: { data?: ResourceRow } };
  return maybe?.data?.data;
}

async function fetchUiSchema(municipalityId: number, schemaId: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_API_PATH}/jsonschemas/${municipalityId}/${schemaId}/ui-schema`, {
    credentials: 'include',
  });
  if (!res.ok) {
    if (res.status === 404) return {};
    throw new Error(`ui-schema ${res.status}`);
  }
  const body = (await res.json()) as { data?: { value?: Record<string, unknown> } | null };
  return body.data?.value ?? {};
}

async function saveUiSchema(municipalityId: number, schemaId: string, value: Record<string, unknown>) {
  await fetch(`${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_API_PATH}/jsonschemas/${municipalityId}/${schemaId}/ui-schema`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value }),
  });
}

function Editor({ initial, isNew }: { initial?: ResourceRow; isNew: boolean }) {
  const router = useRouter();
  const municipalityId = useLocalStorage((s) => s.municipalityId);
  const schemaId = String(initial?.id ?? '');
  const [mode, setMode] = React.useState<EditorMode>('schema');
  const [name, setName] = React.useState(String(initial?.name ?? ''));
  const [version, setVersion] = React.useState(String(initial?.version ?? '1.0'));
  const [description, setDescription] = React.useState(String(initial?.description ?? ''));
  const [versionIncrement, setVersionIncrement] = React.useState<'MINOR' | 'MAJOR'>('MINOR');
  const [schemaValue, setSchemaValue] = React.useState<Record<string, unknown>>(
    (initial?.value as Record<string, unknown> | undefined) ?? emptySchema
  );
  const [uiSchema, setUiSchema] = React.useState<Record<string, unknown>>({});
  const [uiSchemaLoading, setUiSchemaLoading] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    if (isNew || !schemaId) {
      setUiSchema({});
      return;
    }
    setUiSchemaLoading(true);
    fetchUiSchema(municipalityId, schemaId)
      .then((value) => {
        if (!cancelled) setUiSchema(value);
      })
      .catch(() => {
        if (!cancelled) setUiSchema({});
      })
      .finally(() => {
        if (!cancelled) setUiSchemaLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isNew, municipalityId, schemaId]);

  const save = async () => {
    if (!name.trim()) {
      toast.error('Namn är obligatoriskt.');
      return;
    }
    if (!version.trim()) {
      toast.error('Version är obligatoriskt.');
      return;
    }

    const data = { name: name.trim(), version, description, value: schemaValue, versionIncrement };
    try {
      const response = isNew
        ? await createRow('jsonSchemas', municipalityId, data)
        : await updateRow('jsonSchemas', municipalityId, initial as ResourceRow, data);
      const saved = dataFromResponse(response);
      const savedId = String(saved?.id ?? schemaId);
      if (savedId) await saveUiSchema(municipalityId, savedId, uiSchema);
      toast.success(`${isNew ? 'Skapade' : 'Sparade'} schema "${name}".`);
      router.push(savedId ? `/jsonSchemas/${savedId}` : '/jsonSchemas');
    } catch (err) {
      toast.error(`Kunde inte spara schema: ${errMsg(err)}`);
    }
  };

  const modeButton = (value: EditorMode, label: string, icon: React.ReactNode) => (
    <Button
      type="button"
      variant={mode === value ? 'secondary' : 'ghost'}
      size="sm"
      className={cn('justify-start', mode !== value && 'text-muted-foreground')}
      onClick={() => setMode(value)}
    >
      {icon}
      {label}
    </Button>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label>Namn *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} disabled={!isNew} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>{isNew ? 'Version *' : 'Versionshöjning'}</Label>
          {isNew ? (
            <Input value={version} onChange={(e) => setVersion(e.target.value)} />
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{version}</Badge>
              <span className="text-sm text-muted-foreground">blir</span>
              <Badge>{nextVersion(version, versionIncrement)}</Badge>
              <Button
                type="button"
                variant={versionIncrement === 'MINOR' ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setVersionIncrement('MINOR')}
              >
                Minor
              </Button>
              <Button
                type="button"
                variant={versionIncrement === 'MAJOR' ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setVersionIncrement('MAJOR')}
              >
                Major
              </Button>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label>Beskrivning</Label>
          <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(28rem,0.9fr)]">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base">JSON-schema</CardTitle>
                <CardDescription>Redigera schemat och dess UI-schema utan att tappa okända JSON Schema-fält.</CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-1 rounded-md border p-1">
                {modeButton('schema', 'Schema JSON', <Braces className="size-4" />)}
                {modeButton('uiSchema', 'UI schema', <LayoutTemplate className="size-4" />)}
                {modeButton('builder', 'Fältbyggare', <FileJson className="size-4" />)}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {mode === 'schema' && <JsonEditor value={schemaValue} onChange={setSchemaValue} height="620px" />}
            {mode === 'uiSchema' && (
              <div className="flex flex-col gap-2">
                {uiSchemaLoading && <p className="text-sm text-muted-foreground">Hämtar UI schema...</p>}
                <JsonEditor value={uiSchema} onChange={setUiSchema} height="620px" />
              </div>
            )}
            {mode === 'builder' && <SchemaBuilder value={schemaValue} onChange={(schema) => setSchemaValue(schema as Record<string, unknown>)} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Eye className="size-4" />
              Förhandsvisning
            </CardTitle>
            <CardDescription>Renderas med samma RJSF-kontrakt och widgetalias som public-appen använder.</CardDescription>
          </CardHeader>
          <CardContent>
            <JsonSchemaPreview schema={schemaValue} uiSchema={Object.keys(uiSchema).length ? uiSchema : undefined} />
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3 border-t pt-6">
        <Button type="button" onClick={save}>
          <Save className="size-4" />
          {isNew ? 'Skapa' : 'Spara ny version'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push('/jsonSchemas')}>
          Avbryt
        </Button>
      </div>
    </div>
  );
}

export default function JsonSchemaEditPage() {
  const router = useRouter();
  const rawId = Array.isArray(router.query.id) ? router.query.id[0] : router.query.id;
  const isNew = rawId === 'new';
  const { row: initial, loading } = useResourceRecord('jsonSchemas', rawId);

  if (!router.isReady) {
    return (
      <AdminLayout title="Laddar..." breadcrumb="JSON-scheman">
        {null}
      </AdminLayout>
    );
  }

  const title = isNew ? 'Skapa JSON-schema' : String(initial?.name ?? rawId ?? 'Redigera JSON-schema');

  return (
    <AdminLayout
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
        <p className="text-muted-foreground">Hämtar...</p>
      ) : !isNew && !initial ? (
        <p className="text-muted-foreground">Hittade inget schema med id {rawId}.</p>
      ) : (
        <Editor initial={initial} isNew={isNew} />
      )}
    </AdminLayout>
  );
}
