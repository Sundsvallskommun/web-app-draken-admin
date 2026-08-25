import {
  APPLICATION_VALUE,
  CAPACITIES,
  CAPACITY_LABELS,
  FACET_KEYS,
  findSelectionRule,
  OUTCOMES,
  OUTCOME_LABELS,
  PROCESS_LABELS,
  PROCESSES,
  TEMPLATE_TYPE_METADATA,
  type Capacity,
  type Outcome,
  type Process,
  type TemplateKind,
} from '@config/template-schema';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@components/ui/collapsible';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { Switch } from '@components/ui/switch';
import { Textarea } from '@components/ui/textarea';
import { MonacoField } from '@admin/monaco-field';
import { type ResourceRow } from '@admin/resource-config';
import { useNamespaces } from '@admin/use-namespaces';
import { createRow, updateRow } from '@admin/use-resource-data';
import {
  approveTemplateMetadata,
  getApprovalTimestamp,
  isTemplateApproved,
  replaceMetadataValue,
  TEST_APPROVED_AT_KEY,
  TEST_STATUS_APPROVED,
  TEST_STATUS_KEY,
} from '@utils/template-metadata';
import { useIsProductionEnv } from '@utils/use-is-production-env.hook';
import { useLocalStorage } from '@utils/use-localstorage.hook';
import type { TextEditorProps } from '@sk-web-gui/text-editor';
import { ChevronDown, Code2, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import * as React from 'react';
import { toast } from 'sonner';

const TextEditor = dynamic<TextEditorProps>(() => import('@sk-web-gui/text-editor').then((mod) => mod.TextEditor), {
  ssr: false,
  loading: () => <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">Laddar editor...</div>,
});

const TEMPLATE_TYPES = ['Email', 'Sms', 'Decision', 'Investigation'];
const MANAGED_KEYS = [
  FACET_KEYS.application,
  FACET_KEYS.templateType,
  'namespace',
  FACET_KEYS.process,
  FACET_KEYS.decision,
  FACET_KEYS.capacity,
  'editor',
  TEST_STATUS_KEY,
  TEST_APPROVED_AT_KEY,
];

interface MetaEntry {
  key: string;
  value: string;
}

function parseMeta(m: unknown): MetaEntry[] {
  try {
    if (typeof m === 'string') {
      const parsed = JSON.parse(m || '[]');
      return Array.isArray(parsed) ? parsed : [];
    }
    if (Array.isArray(m)) return m as MetaEntry[];
  } catch {
    /* invalid metadata is handled by falling back to an empty editable set */
  }
  return [];
}

function prettyJson(value: unknown, fallback: unknown): string {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value || JSON.stringify(fallback)) : value ?? fallback;
    return JSON.stringify(parsed, null, 2);
  } catch {
    return typeof value === 'string' ? value : JSON.stringify(fallback, null, 2);
  }
}

function parseJsonText(text: string, fallback: unknown): string | null {
  try {
    return JSON.stringify(JSON.parse(text.trim() || JSON.stringify(fallback)), null, 2);
  } catch {
    return null;
  }
}

function templateKind(value: string): TemplateKind | null {
  if (value === TEMPLATE_TYPE_METADATA.DECISION) return 'DECISION';
  if (value === TEMPLATE_TYPE_METADATA.INVESTIGATION) return 'INVESTIGATION';
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const errMsg = (e: any) => e?.response?.data?.message ?? e?.message ?? 'fel';

export function TemplateForm({ initial, isNew }: { initial?: ResourceRow; isNew: boolean }) {
  const router = useRouter();
  const municipalityId = useLocalStorage((s) => s.municipalityId);
  const namespaceOptions = useNamespaces();
  const { showTestFeatures } = useIsProductionEnv();

  const initialMeta = React.useMemo(() => parseMeta(initial?.metadata), [initial?.metadata]);
  const metaVal = React.useCallback((key: string) => initialMeta.find((entry) => entry.key === key)?.value ?? '', [initialMeta]);

  const approved = !isNew && showTestFeatures && isTemplateApproved(initial?.metadata);
  const approvedAt = getApprovalTimestamp(initial?.metadata);

  const initialTemplateType = metaVal(FACET_KEYS.templateType);
  const [identifier, setIdentifier] = React.useState(String(initial?.identifier ?? ''));
  const [name, setName] = React.useState(String(initial?.name ?? ''));
  const [description, setDescription] = React.useState(String(initial?.description ?? ''));
  const [versionIncrement, setVersionIncrement] = React.useState('MINOR');
  const [content, setContent] = React.useState(String(initial?.content ?? ''));
  const [changeLog, setChangeLog] = React.useState('');
  const [templateType, setTemplateType] = React.useState(initialTemplateType);
  const [customType, setCustomType] = React.useState(initialTemplateType !== '' && !TEMPLATE_TYPES.includes(initialTemplateType));
  const [namespace, setNamespace] = React.useState(metaVal('namespace'));
  const [process, setProcess] = React.useState(metaVal(FACET_KEYS.process) as Process | '');
  const [decision, setDecision] = React.useState(metaVal(FACET_KEYS.decision) as Outcome | '');
  const [capacity, setCapacity] = React.useState(metaVal(FACET_KEYS.capacity) as Capacity | '');
  const [isRich, setIsRich] = React.useState(metaVal('editor') === 'richtexteditor');
  const [defaultValuesJson, setDefaultValuesJson] = React.useState(prettyJson(initial?.defaultValues, []));
  const [extra, setExtra] = React.useState<MetaEntry[]>(initialMeta.filter((entry) => !MANAGED_KEYS.includes(entry.key)));
  const [metadataUnlocked, setMetadataUnlocked] = React.useState(false);
  const [manualMetadataJson, setManualMetadataJson] = React.useState('');

  const kind = templateKind(templateType);
  const selectionRule = kind && process ? findSelectionRule(kind, process as Process) : undefined;
  const needsDecision = !!selectionRule?.requiredFacets.includes('decision');
  const needsCapacity = !!selectionRule?.requiredFacets.includes('capacity');
  const readOnly = approved;

  const namespaceSelectOptions = React.useMemo(() => {
    if (!namespace || namespaceOptions.some((option) => option.value === namespace)) return namespaceOptions;
    return [{ value: namespace, label: namespace }, ...namespaceOptions];
  }, [namespace, namespaceOptions]);

  const generatedMetadata = React.useMemo<MetaEntry[]>(() => {
    const entries: MetaEntry[] = [
      { key: FACET_KEYS.application, value: APPLICATION_VALUE },
      ...(templateType ? [{ key: FACET_KEYS.templateType, value: templateType }] : []),
      ...(namespace ? [{ key: 'namespace', value: namespace }] : []),
      ...(kind && process ? [{ key: FACET_KEYS.process, value: process }] : []),
      ...(kind && needsDecision && decision ? [{ key: FACET_KEYS.decision, value: decision }] : []),
      ...(kind && needsCapacity && capacity ? [{ key: FACET_KEYS.capacity, value: capacity }] : []),
      ...(isRich ? [{ key: 'editor', value: 'richtexteditor' }] : []),
      ...extra.filter((entry) => entry.key),
    ];

    if (approved) {
      return replaceMetadataValue(
        replaceMetadataValue(entries, TEST_STATUS_KEY, TEST_STATUS_APPROVED),
        TEST_APPROVED_AT_KEY,
        approvedAt ?? ''
      );
    }
    return entries;
  }, [approved, approvedAt, capacity, decision, extra, isRich, kind, namespace, needsCapacity, needsDecision, process, templateType]);

  const metadataJson = metadataUnlocked ? manualMetadataJson : JSON.stringify(generatedMetadata, null, 2);

  React.useEffect(() => {
    if (!metadataUnlocked) {
      setManualMetadataJson(JSON.stringify(generatedMetadata, null, 2));
    }
  }, [generatedMetadata, metadataUnlocked]);

  const save = async (metadataEntries: MetaEntry[]) => {
    if (!identifier.trim()) {
      toast.error('Identifierare är obligatoriskt.');
      return;
    }

    const normalizedDefaultValues = parseJsonText(defaultValuesJson, []);
    if (!normalizedDefaultValues) {
      toast.error('Standardvärden innehåller ogiltig JSON.');
      return;
    }

    const data = {
      identifier: identifier.trim(),
      name,
      description,
      content,
      changeLog,
      versionIncrement,
      metadata: JSON.stringify(metadataEntries, null, 2),
      defaultValues: normalizedDefaultValues,
    };

    try {
      if (isNew) await createRow('templates', municipalityId, data);
      else await updateRow('templates', municipalityId, initial as ResourceRow, data);
      toast.success(`${isNew ? 'Skapade' : 'Sparade'} mall "${name || identifier}".`);
      router.push('/templates');
    } catch (err) {
      toast.error(`Kunde inte spara: ${errMsg(err)}`);
    }
  };

  const onSubmit = async () => {
    let metadataEntries = generatedMetadata;
    if (metadataUnlocked) {
      const parsed = parseJsonText(manualMetadataJson, []);
      if (!parsed) {
        toast.error('Metadata innehåller ogiltig JSON.');
        return;
      }
      const entries = JSON.parse(parsed) as unknown;
      if (!Array.isArray(entries)) {
        toast.error('Metadata måste vara en array med key/value-objekt.');
        return;
      }
      metadataEntries = entries as MetaEntry[];
    }
    await save(metadataEntries);
  };

  const approve = () => {
    const now = new Date().toISOString();
    save(approveTemplateMetadata(generatedMetadata, now));
  };

  const unapprove = () => {
    save(generatedMetadata.filter((entry) => entry.key !== TEST_STATUS_KEY && entry.key !== TEST_APPROVED_AT_KEY));
  };

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      {approved && (
        <div className="flex flex-wrap items-center gap-3 rounded-md border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm">
          <ShieldCheck className="size-5 text-emerald-600" />
          <div className="min-w-0 flex-1">
            <p className="font-medium">Mallen är godkänd för produktion.</p>
            {approvedAt && <p className="text-muted-foreground">Godkänd {new Date(approvedAt).toLocaleString('sv-SE')}.</p>}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={unapprove}>
            Ta bort godkännande
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label>Identifierare *</Label>
          <Input value={identifier} onChange={(e) => setIdentifier(e.target.value)} disabled={!isNew || readOnly} placeholder="t.ex. decision.letter" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Namn</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} disabled={readOnly} />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label>Beskrivning</Label>
          <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} disabled={readOnly} />
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <h3 className="mb-3 text-sm font-semibold">Inställningar</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label>Typ av mall</Label>
            <Select
              value={customType ? '__custom__' : templateType}
              onValueChange={(value) => {
                if (value === '__custom__') {
                  setCustomType(true);
                  setTemplateType('');
                } else if (value === '__none__') {
                  setCustomType(false);
                  setTemplateType('');
                } else {
                  setCustomType(false);
                  setTemplateType(value);
                }
                setProcess('');
                setDecision('');
                setCapacity('');
              }}
              disabled={readOnly}
            >
              <SelectTrigger>
                <SelectValue placeholder="Välj typ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Ingen</SelectItem>
                {TEMPLATE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
                <SelectItem value="__custom__">Annan...</SelectItem>
              </SelectContent>
            </Select>
            {customType && (
              <Input value={templateType} onChange={(e) => setTemplateType(e.target.value)} disabled={readOnly} placeholder="Ange malltyp" />
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Namespace</Label>
            <Select value={namespace} onValueChange={setNamespace} disabled={readOnly}>
              <SelectTrigger>
                <SelectValue placeholder="Välj namespace" />
              </SelectTrigger>
              <SelectContent>
                {namespaceSelectOptions.map((ns) => (
                  <SelectItem key={ns.value} value={ns.value}>
                    {ns.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {kind && (
            <div className="flex flex-col gap-1.5">
              <Label>Process</Label>
              <Select
                value={process}
                onValueChange={(value) => {
                  setProcess(value as Process);
                  setDecision('');
                  setCapacity('');
                }}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Välj process" />
                </SelectTrigger>
                <SelectContent>
                  {PROCESSES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {PROCESS_LABELS[item]} ({item})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {needsDecision && (
            <div className="flex flex-col gap-1.5">
              <Label>Beslutsutfall</Label>
              <Select value={decision} onValueChange={(value) => setDecision(value as Outcome)} disabled={readOnly}>
                <SelectTrigger>
                  <SelectValue placeholder="Välj utfall" />
                </SelectTrigger>
                <SelectContent>
                  {OUTCOMES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {OUTCOME_LABELS[item]} ({item})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {needsCapacity && (
            <div className="flex flex-col gap-1.5">
              <Label>Kapacitet</Label>
              <Select value={capacity} onValueChange={(value) => setCapacity(value as Capacity)} disabled={readOnly}>
                <SelectTrigger>
                  <SelectValue placeholder="Välj kapacitet" />
                </SelectTrigger>
                <SelectContent>
                  {CAPACITIES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {CAPACITY_LABELS[item]} ({item})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label>Versionshöjning</Label>
            <Select value={versionIncrement} onValueChange={setVersionIncrement} disabled={readOnly}>
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

        <div className="mt-4 flex items-center justify-between rounded-md border p-3">
          <div className="space-y-0.5 pr-4">
            <Label>Visuell texteditor (rich text)</Label>
            <p className="text-xs text-muted-foreground">Sparas som metadata editor: richtexteditor och styr rendering i konsumenten.</p>
          </div>
          <Switch checked={isRich} onCheckedChange={setIsRich} disabled={readOnly} />
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">Ytterligare metadata</Label>
          {extra.map((entry, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={entry.key}
                placeholder="nyckel"
                className="w-44"
                disabled={readOnly}
                onChange={(e) => setExtra((items) => items.map((item, j) => (j === i ? { ...item, key: e.target.value } : item)))}
              />
              <Input
                value={entry.value}
                placeholder="värde"
                disabled={readOnly}
                onChange={(e) => setExtra((items) => items.map((item, j) => (j === i ? { ...item, value: e.target.value } : item)))}
              />
              <Button type="button" variant="ghost" size="icon" aria-label="Ta bort metadata" disabled={readOnly} onClick={() => setExtra((items) => items.filter((_, j) => j !== i))}>
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" className="w-fit" disabled={readOnly} onClick={() => setExtra((items) => [...items, { key: '', value: '' }])}>
            <Plus className="size-4" />
            Lägg till metadata
          </Button>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-md border p-3">
          <div className="space-y-0.5 pr-4">
            <Label>Redigera metadata manuellt</Label>
            <p className="text-xs text-muted-foreground">Använd endast för legacyvärden eller specialfall som inte täcks av fälten ovan.</p>
          </div>
          <Switch checked={metadataUnlocked} onCheckedChange={setMetadataUnlocked} disabled={readOnly} />
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {generatedMetadata.map((entry, i) => (
            <Badge key={`${entry.key}-${i}`} variant="secondary" className="font-mono text-xs">
              {entry.key}: {entry.value}
            </Badge>
          ))}
        </div>

        <Collapsible className="mt-3 group/meta" defaultOpen={metadataUnlocked}>
          <CollapsibleTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="text-muted-foreground">
              <Code2 className="size-4" />
              Visa metadata som JSON
              <ChevronDown className="size-4 transition-transform group-data-[state=open]/meta:rotate-180" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            {metadataUnlocked ? (
              <MonacoField value={metadataJson} onChange={setManualMetadataJson} language="json" disabled={readOnly} />
            ) : (
              <pre className="mt-2 max-h-72 overflow-auto rounded-md border bg-muted p-3 font-mono text-xs leading-relaxed">{metadataJson}</pre>
            )}
          </CollapsibleContent>
        </Collapsible>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Innehåll</Label>
        {isRich ? (
          <TextEditor className="min-h-[320px]" value={{ markup: content }} readOnly={readOnly} onChange={(e) => setContent(e.target.value.markup ?? '')} />
        ) : (
          <MonacoField value={content} onChange={setContent} language="markdown" disabled={readOnly} />
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Standardvärden (JSON)</Label>
        <MonacoField value={defaultValuesJson} onChange={setDefaultValuesJson} language="json" disabled={readOnly} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Ändringslogg</Label>
        <Input value={changeLog} onChange={(e) => setChangeLog(e.target.value)} disabled={readOnly} />
      </div>

      <div className="flex flex-wrap gap-3 border-t pt-6">
        <Button type="button" onClick={onSubmit} disabled={readOnly}>
          {isNew ? 'Skapa mall' : 'Spara ändringar'}
        </Button>
        {showTestFeatures && !isNew && !approved && (
          <Button type="button" variant="outline" onClick={approve}>
            <ShieldCheck className="size-4" />
            Godkänn för produktion
          </Button>
        )}
        <Button type="button" variant="outline" onClick={() => router.push('/templates')}>
          Avbryt
        </Button>
      </div>
    </div>
  );
}
