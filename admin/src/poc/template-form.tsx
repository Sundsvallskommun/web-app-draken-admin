import { PROCESS_LABELS, PROCESSES } from '@config/template-schema';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@components/ui/collapsible';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { Switch } from '@components/ui/switch';
import { Textarea } from '@components/ui/textarea';
import { MonacoField } from '@poc/monaco-field';
import { pocNamespaces, type PocRow } from '@poc/poc-resources';
import { createRow, updateRow } from '@poc/use-poc-rows';
import { useLocalStorage } from '@utils/use-localstorage.hook';
import { ChevronDown, Code2, Plus, Trash2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import * as React from 'react';
import { toast } from 'sonner';

// Quill-based rich text editor (same component the old admin used). Client-only.
type TextEditorProps = {
  className?: string;
  value: { markup: string };
  onChange: (e: { target: { value: { markup: string } } }) => void;
};
const TextEditor = dynamic(() => import('@sk-web-gui/text-editor'), {
  ssr: false,
  loading: () => <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">Laddar editor…</div>,
}) as React.ComponentType<TextEditorProps>;

const TEMPLATE_TYPES = ['Email', 'Sms', 'Decision', 'Investigation'];
const MANAGED_KEYS = ['application', 'templateType', 'namespace', 'process', 'editor'];

interface MetaEntry {
  key: string;
  value: string;
}

function parseMeta(m: unknown): MetaEntry[] {
  try {
    if (typeof m === 'string') return JSON.parse(m || '[]');
    if (Array.isArray(m)) return m as MetaEntry[];
  } catch {
    /* ignore */
  }
  return [];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const errMsg = (e: any) => e?.response?.data?.message ?? e?.message ?? 'fel';

export function TemplateForm({ initial, isNew, live = false }: { initial?: PocRow; isNew: boolean; live?: boolean }) {
  const router = useRouter();
  const municipalityId = useLocalStorage((s) => s.municipalityId);

  const initialMeta = parseMeta(initial?.metadata);
  const metaVal = (k: string) => initialMeta.find((e) => e.key === k)?.value ?? '';

  const identifier = String(initial?.identifier ?? '');
  const [name, setName] = React.useState(String(initial?.name ?? ''));
  const [description, setDescription] = React.useState(String(initial?.description ?? ''));
  const [versionIncrement, setVersionIncrement] = React.useState('MINOR');
  const [content, setContent] = React.useState(String(initial?.content ?? ''));
  const [changeLog, setChangeLog] = React.useState('');
  const [templateType, setTemplateType] = React.useState(metaVal('templateType'));
  const [namespace, setNamespace] = React.useState(metaVal('namespace'));
  const [process, setProcess] = React.useState(metaVal('process'));
  const [isRich, setIsRich] = React.useState(metaVal('editor') === 'richtexteditor');
  const [extra, setExtra] = React.useState<MetaEntry[]>(initialMeta.filter((e) => !MANAGED_KEYS.includes(e.key)));

  const isDecisionKind = templateType === 'Decision' || templateType === 'Investigation';

  // The key/value metadata combination consumed downstream where templates are used.
  const metadata: MetaEntry[] = [
    { key: 'application', value: 'draken' },
    ...(templateType ? [{ key: 'templateType', value: templateType }] : []),
    ...(namespace ? [{ key: 'namespace', value: namespace }] : []),
    ...(isDecisionKind && process ? [{ key: 'process', value: process }] : []),
    ...(isRich ? [{ key: 'editor', value: 'richtexteditor' }] : []),
    ...extra.filter((e) => e.key),
  ];

  const onSubmit = async () => {
    const data = {
      identifier,
      name,
      description,
      content,
      changeLog,
      versionIncrement,
      metadata: JSON.stringify(metadata),
    };
    if (!live) {
      toast.success(`${isNew ? 'Skapade' : 'Sparade'} mall "${name || identifier}" (exempeldata – inget sparas).`);
      router.push('/templates');
      return;
    }
    try {
      if (isNew) await createRow('templates', municipalityId, data);
      else await updateRow('templates', municipalityId, initial as PocRow, data);
      toast.success(`${isNew ? 'Skapade' : 'Sparade'} mall "${name || identifier}".`);
      router.push('/templates');
    } catch (err) {
      toast.error(`Kunde inte spara: ${errMsg(err)}`);
    }
  };

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      {/* Grunduppgifter */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label>Identifierare *</Label>
          <Input value={identifier} disabled placeholder="t.ex. decision.letter" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Namn</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label>Beskrivning</Label>
          <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
      </div>

      {/* Inställningar → metadata */}
      <div className="rounded-lg border p-4">
        <h3 className="mb-3 text-sm font-semibold">Inställningar</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label>Typ av mall</Label>
            <Select value={templateType} onValueChange={setTemplateType}>
              <SelectTrigger>
                <SelectValue placeholder="Välj typ" />
              </SelectTrigger>
              <SelectContent>
                {TEMPLATE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Namespace</Label>
            <Select value={namespace} onValueChange={setNamespace}>
              <SelectTrigger>
                <SelectValue placeholder="Välj namespace" />
              </SelectTrigger>
              <SelectContent>
                {pocNamespaces.map((ns) => (
                  <SelectItem key={ns.namespace} value={ns.namespace}>
                    {ns.displayName} ({ns.namespace})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {isDecisionKind && (
            <div className="flex flex-col gap-1.5">
              <Label>Process</Label>
              <Select value={process} onValueChange={setProcess}>
                <SelectTrigger>
                  <SelectValue placeholder="Välj process" />
                </SelectTrigger>
                <SelectContent>
                  {PROCESSES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PROCESS_LABELS[p]} ({p})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label>Versionshöjning</Label>
            <Select value={versionIncrement} onValueChange={setVersionIncrement}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MINOR">Minor</SelectItem>
                <SelectItem value="MAJOR">Major</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Editor-läge → metadata 'editor' (styr hur innehållet renderas hos konsumenten) */}
        <div className="mt-4 flex items-center justify-between rounded-md border p-3">
          <div className="space-y-0.5 pr-4">
            <Label>Visuell texteditor (rich text)</Label>
            <p className="text-xs text-muted-foreground">
              Skriv innehållet i en WYSIWYG-editor i stället för vanlig text. Sparas som metadata{' '}
              <code className="rounded bg-background px-1 font-mono">editor: richtexteditor</code> så konsument-appen
              (t.ex. Draken) renderar mallen som rich text.
            </p>
          </div>
          <Switch checked={isRich} onCheckedChange={setIsRich} />
        </div>

        {/* Extra fri metadata (key/value) */}
        <div className="mt-4 flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">Ytterligare metadata</Label>
          {extra.map((entry, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={entry.key}
                placeholder="nyckel"
                className="w-44"
                onChange={(e) => setExtra((x) => x.map((it, j) => (j === i ? { ...it, key: e.target.value } : it)))}
              />
              <Input
                value={entry.value}
                placeholder="värde"
                onChange={(e) => setExtra((x) => x.map((it, j) => (j === i ? { ...it, value: e.target.value } : it)))}
              />
              <Button variant="ghost" size="icon" aria-label="Ta bort metadata" onClick={() => setExtra((x) => x.filter((_, j) => j !== i))}>
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" className="w-fit" onClick={() => setExtra((x) => [...x, { key: '', value: '' }])}>
            <Plus className="size-4" />
            Lägg till metadata
          </Button>
        </div>

        {/* Genererad metadata-kombination (det som används nedströms) */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {metadata.map((m, i) => (
            <Badge key={i} variant="secondary" className="font-mono text-xs">
              {m.key}: {m.value}
            </Badge>
          ))}
        </div>

        {/* Klicka fram metadatan som JSON (det som skickas in) */}
        <Collapsible className="mt-3 group/meta">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <Code2 className="size-4" />
              Visa som JSON
              <ChevronDown className="size-4 transition-transform group-data-[state=open]/meta:rotate-180" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <pre className="mt-2 max-h-72 overflow-auto rounded-md border bg-muted p-3 font-mono text-xs leading-relaxed">
              {JSON.stringify(metadata, null, 2)}
            </pre>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Innehåll – rich text om 'editor: richtexteditor', annars Monaco */}
      <div className="flex flex-col gap-1.5">
        <Label>Innehåll</Label>
        {isRich ? (
          <TextEditor value={{ markup: content }} onChange={(e) => setContent(e.target.value.markup)} />
        ) : (
          <MonacoField value={content} onChange={setContent} language="markdown" />
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Ändringslogg</Label>
        <Input value={changeLog} onChange={(e) => setChangeLog(e.target.value)} />
      </div>

      <div className="flex gap-3 border-t pt-6">
        <Button onClick={onSubmit}>{isNew ? 'Skapa mall' : 'Spara ändringar'}</Button>
        <Button variant="outline" onClick={() => router.push('/templates')}>
          Avbryt
        </Button>
      </div>
    </div>
  );
}
