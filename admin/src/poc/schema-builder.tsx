import { Button } from '@components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { Switch } from '@components/ui/switch';
import { Textarea } from '@components/ui/textarea';
import { MonacoField } from '@poc/monaco-field';
import { Plus, Trash2 } from 'lucide-react';
import * as React from 'react';

// Representative subset of the real builder's field types.
const FIELD_TYPES = [
  { type: 'text', label: 'Textfält' },
  { type: 'textarea', label: 'Textområde' },
  { type: 'number', label: 'Nummer' },
  { type: 'checkbox', label: 'Kryssruta' },
  { type: 'select', label: 'Dropdown' },
  { type: 'date', label: 'Datum' },
] as const;

type FieldType = (typeof FIELD_TYPES)[number]['type'];

interface BuilderField {
  id: string;
  name: string;
  title: string;
  type: FieldType;
  required: boolean;
  options: string; // comma-separated, for select
}

let counter = 0;
const uid = () => `f${++counter}`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseSchema(value: any): BuilderField[] {
  let schema = value;
  if (typeof value === 'string') {
    try {
      schema = JSON.parse(value);
    } catch {
      return [];
    }
  }
  const props = schema?.properties ?? {};
  const required: string[] = schema?.required ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Object.entries(props).map(([name, def]: [string, any]) => {
    let type: FieldType = 'text';
    if (def.type === 'boolean') type = 'checkbox';
    else if (def.type === 'number' || def.type === 'integer') type = 'number';
    else if (def.enum) type = 'select';
    else if (def.format === 'date') type = 'date';
    else if (def.format === 'textarea') type = 'textarea';
    return {
      id: uid(),
      name,
      title: def.title ?? name,
      type,
      required: required.includes(name),
      options: (def.enum ?? []).join(', '),
    };
  });
}

function buildSchema(fields: BuilderField[]) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const properties: Record<string, any> = {};
  const required: string[] = [];
  for (const f of fields) {
    if (!f.name) continue;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const def: any = { title: f.title || f.name };
    if (f.type === 'checkbox') def.type = 'boolean';
    else if (f.type === 'number') def.type = 'number';
    else {
      def.type = 'string';
      if (f.type === 'date') def.format = 'date';
      if (f.type === 'textarea') def.format = 'textarea';
      if (f.type === 'select') def.enum = f.options.split(',').map((o) => o.trim()).filter(Boolean);
    }
    properties[f.name] = def;
    if (f.required) required.push(f.name);
  }
  return { $schema: 'https://json-schema.org/draft/2020-12/schema', type: 'object', properties, ...(required.length ? { required } : {}) };
}

function FieldPreview({ field }: { field: BuilderField }) {
  const label = (
    <Label>
      {field.title || field.name}
      {field.required && ' *'}
    </Label>
  );
  if (field.type === 'checkbox') {
    return (
      <div className="flex items-center justify-between rounded-md border p-3">
        {label}
        <Switch />
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1.5">
      {label}
      {field.type === 'textarea' ? (
        <Textarea rows={2} />
      ) : field.type === 'select' ? (
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Välj…" />
          </SelectTrigger>
          <SelectContent>
            {field.options
              .split(',')
              .map((o) => o.trim())
              .filter(Boolean)
              .map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      ) : (
        <Input type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'} />
      )}
    </div>
  );
}

export function SchemaBuilder({ value, onChange }: { value: unknown; onChange?: (schema: object) => void }) {
  const [fields, setFields] = React.useState<BuilderField[]>(() => parseSchema(value));

  const update = (id: string, patch: Partial<BuilderField>) =>
    setFields((fs) => fs.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  const remove = (id: string) => setFields((fs) => fs.filter((f) => f.id !== id));
  const add = () =>
    setFields((fs) => [...fs, { id: uid(), name: `field${fs.length + 1}`, title: '', type: 'text', required: false, options: '' }]);

  const schema = buildSchema(fields);

  // Lift the generated schema so the page can save it.
  React.useEffect(() => {
    onChange?.(buildSchema(fields));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Builder */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Fält</CardTitle>
          <Button type="button" size="sm" variant="outline" onClick={add}>
            <Plus className="size-4" />
            Lägg till fält
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {fields.length === 0 && <p className="text-sm text-muted-foreground">Inga fält ännu.</p>}
          {fields.map((f) => (
            <div key={f.id} className="flex flex-col gap-2 rounded-md border p-3">
              <div className="flex items-center gap-2">
                <Input value={f.title} onChange={(e) => update(f.id, { title: e.target.value })} placeholder="Etikett" />
                <Button type="button" variant="ghost" size="icon" aria-label="Ta bort fält" onClick={() => remove(f.id)}>
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  value={f.name}
                  onChange={(e) => update(f.id, { name: e.target.value })}
                  placeholder="nyckel"
                  className="w-36 font-mono text-xs"
                />
                <Select value={f.type} onValueChange={(v) => update(f.id, { type: v as FieldType })}>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_TYPES.map((t) => (
                      <SelectItem key={t.type} value={t.type}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Switch checked={f.required} onCheckedChange={(c) => update(f.id, { required: c })} />
                  Obligatoriskt
                </label>
              </div>
              {f.type === 'select' && (
                <Input
                  value={f.options}
                  onChange={(e) => update(f.id, { options: e.target.value })}
                  placeholder="Alternativ, kommaseparerade"
                />
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Live preview + generated schema */}
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Förhandsvisning</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {fields.length === 0 ? (
              <p className="text-sm text-muted-foreground">Lägg till fält för att se formuläret.</p>
            ) : (
              fields.map((f) => <FieldPreview key={f.id} field={f} />)
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-1.5">
          <Label>Genererat schema (JSON)</Label>
          <MonacoField value={JSON.stringify(schema, null, 2)} onChange={() => {}} language="json" disabled />
        </div>
      </div>
    </div>
  );
}
