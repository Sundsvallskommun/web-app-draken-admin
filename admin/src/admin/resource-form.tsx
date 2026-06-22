import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@components/ui/alert-dialog';
import { Button } from '@components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@components/ui/form';
import { Input } from '@components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { Switch } from '@components/ui/switch';
import { Textarea } from '@components/ui/textarea';
import { MonacoField } from '@admin/monaco-field';
import { type FieldDef, type ResourceConfig, type ResourceRow } from '@admin/resource-config';
import { useNamespaces } from '@admin/use-namespaces';
import { createRow, getResourceDefaults, getResourceRequiredFields, removeRow, updateRow } from '@admin/use-resource-data';
import { useLocalStorage } from '@utils/use-localstorage.hook';
import type { TextEditorProps } from '@sk-web-gui/text-editor';
import { Trash2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const errMsg = (e: any) => e?.response?.data?.message ?? e?.message ?? 'fel';

const TextEditor = dynamic<TextEditorProps>(() => import('@sk-web-gui/text-editor').then((mod) => mod.TextEditor), {
  ssr: false,
  loading: () => <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">Laddar editor...</div>,
});

type RichTextValue = NonNullable<TextEditorProps['value']>;

function defaultFor(field: FieldDef, initial: ResourceRow | undefined, defaults: Record<string, unknown>) {
  const v = initial?.[field.key];
  if (v !== undefined) return v;
  if (field.richTextTargets) {
    const plainText = initial?.[field.richTextTargets.plainText] ?? defaults[field.richTextTargets.plainText];
    const markup = initial?.[field.richTextTargets.markup] ?? defaults[field.richTextTargets.markup];
    return {
      plainText: typeof plainText === 'string' ? plainText : '',
      markup: typeof markup === 'string' ? markup : undefined,
    };
  }
  for (const key of field.syncKeys ?? []) {
    const syncedValue = initial?.[key] ?? defaults[key];
    if (syncedValue !== undefined && syncedValue !== null && syncedValue !== '') return syncedValue;
  }
  const d = defaults[field.key];
  if (d !== undefined) {
    if (field.key === 'types' && Array.isArray(d)) return d.map((item) => String((item as { name?: unknown }).name ?? item)).join(', ');
    return d;
  }
  return field.type === 'switch' ? false : field.type === 'number' ? '' : '';
}

function normalizeValues(resource: ResourceConfig, values: Record<string, unknown>) {
  const normalized = { ...values };
  for (const field of resource.fields) {
    if (field.richTextTargets) {
      const value = normalized[field.key] as RichTextValue | string | undefined;
      const plainText = typeof value === 'object' ? value.plainText : typeof value === 'string' ? value : '';
      const markup = typeof value === 'object' ? value.markup : typeof value === 'string' ? value : '';
      normalized[field.richTextTargets.plainText] = plainText ?? '';
      normalized[field.richTextTargets.markup] = markup ?? '';
      delete normalized[field.key];
    }
    if (field.syncKeys?.length) {
      const value = normalized[field.key] ?? '';
      field.syncKeys.forEach((key) => {
        normalized[key] = value;
      });
      delete normalized[field.key];
    }
    if (field.type === 'number') {
      const value = normalized[field.key];
      normalized[field.key] = value === '' || value == null ? undefined : Number(value);
    }
    if (field.key === 'types') {
      const raw = normalized[field.key];
      normalized[field.key] =
        typeof raw === 'string'
          ? raw
              .split(',')
              .map((part) => part.trim())
              .filter(Boolean)
              .map((name) => ({ name }))
          : raw;
    }
  }
  return normalized;
}

export function ResourceForm({ resource, initial, isNew }: { resource: ResourceConfig; initial?: ResourceRow; isNew: boolean }) {
  const router = useRouter();
  const municipalityId = useLocalStorage((s) => s.municipalityId);
  const namespaceOptions = useNamespaces();
  const contractDefaults = getResourceDefaults(resource.name);
  const requiredFields = getResourceRequiredFields(resource.name);
  const defaultValues = Object.fromEntries(resource.fields.map((f) => [f.key, defaultFor(f, initial, contractDefaults)]));
  const form = useForm<Record<string, unknown>>({ defaultValues });
  const isDirty = form.formState.isDirty;

  const title = String(initial?.[resource.fields[0].key] ?? '');

  const onSubmit = async (values: Record<string, unknown>) => {
    const name = String(values[resource.fields[0].key] ?? '');
    const data = normalizeValues(resource, values);
    try {
      if (isNew) await createRow(resource.name, municipalityId, data);
      else await updateRow(resource.name, municipalityId, initial as ResourceRow, data);
      toast.success(`${isNew ? 'Skapade' : 'Sparade'} ${resource.label.toLowerCase()} "${name}".`);
      router.push(`/${resource.name}`);
    } catch (err) {
      toast.error(`Kunde inte spara: ${errMsg(err)}`);
    }
  };

  const onDelete = async () => {
    if (!initial) return;
    try {
      await removeRow(resource.name, municipalityId, initial);
      toast.success(`${title} togs bort.`);
      router.push(`/${resource.name}`);
    } catch (err) {
      toast.error(`Kunde inte ta bort: ${errMsg(err)}`);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex max-w-xl flex-col gap-6">
        {resource.fields.map((field) => {
          const disabled = !isNew && field.lockedOnEdit;
          const required = field.required || requiredFields.includes(field.key);
          return (
            <FormField
              key={field.key}
              control={form.control}
              name={field.key}
              rules={required ? { required: `${field.label} är obligatoriskt` } : undefined}
              render={({ field: rhf }) => {
                if (field.type === 'switch') {
                  return (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>{field.label}</FormLabel>
                        {field.help && <FormDescription>{field.help}</FormDescription>}
                      </div>
                      <FormControl>
                        <Switch checked={Boolean(rhf.value)} onCheckedChange={rhf.onChange} disabled={disabled} />
                      </FormControl>
                    </FormItem>
                  );
                }

                return (
                  <FormItem>
                    <FormLabel>
                      {field.label}
                      {required && ' *'}
                    </FormLabel>
                    {field.type === 'select' ? (
                      <Select onValueChange={rhf.onChange} value={(rhf.value as string) ?? ''} disabled={disabled}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Välj ett alternativ" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(field.key === 'namespace' ? namespaceOptions : field.options)?.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : field.type === 'code' ? (
                      <MonacoField
                        value={(rhf.value as string) ?? ''}
                        onChange={rhf.onChange}
                        disabled={disabled}
                        language={resource.name === 'jsonSchemas' ? 'json' : 'markdown'}
                      />
                    ) : field.type === 'richtext' ? (
                      <FormControl>
                        <TextEditor
                          className="h-[420px] min-h-[320px] resize-y overflow-auto"
                          value={
                            typeof rhf.value === 'object' && rhf.value !== null
                              ? (rhf.value as RichTextValue)
                              : { markup: (rhf.value as string) ?? '' }
                          }
                          readOnly={disabled}
                          onChange={(event) => rhf.onChange(event.target.value)}
                        />
                      </FormControl>
                    ) : field.type === 'textarea' ? (
                      <FormControl>
                        <Textarea {...rhf} value={(rhf.value as string) ?? ''} disabled={disabled} rows={3} />
                      </FormControl>
                    ) : (
                      <FormControl>
                        <Input
                          {...rhf}
                          value={(rhf.value as string | number) ?? ''}
                          type={field.type === 'number' ? 'number' : 'text'}
                          disabled={disabled}
                        />
                      </FormControl>
                    )}
                    {field.help && <FormDescription>{field.help}</FormDescription>}
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          );
        })}

        <div className="flex flex-wrap items-center gap-3 border-t pt-6">
          <Button type="submit" disabled={!isDirty}>
            {isNew ? 'Skapa' : 'Spara ändringar'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push(`/${resource.name}`)}>
            Avbryt
          </Button>

          {!isNew && resource.canRemove && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="ghost" className="ml-auto text-destructive hover:text-destructive">
                  <Trash2 className="size-4" />
                  Ta bort
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Ta bort {title || 'posten'}?</AlertDialogTitle>
                  <AlertDialogDescription>Detta går inte att ångra.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Avbryt</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete}>Ta bort</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </form>
    </Form>
  );
}
