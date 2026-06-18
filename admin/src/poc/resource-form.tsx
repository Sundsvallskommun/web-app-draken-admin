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
import { type FieldDef, type PocResource, type PocRow } from '@poc/poc-resources';
import { Download, Eye, ShieldCheck, Trash2 } from 'lucide-react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

function defaultFor(field: FieldDef, initial?: PocRow) {
  const v = initial?.[field.key];
  if (v !== undefined) return v;
  return field.type === 'switch' ? false : field.type === 'number' ? '' : '';
}

export function ResourceForm({
  resource,
  initial,
  isNew,
}: {
  resource: PocResource;
  initial?: PocRow;
  isNew: boolean;
}) {
  const router = useRouter();
  const defaultValues = Object.fromEntries(resource.fields.map((f) => [f.key, defaultFor(f, initial)]));
  const form = useForm<Record<string, unknown>>({ defaultValues });
  const isDirty = form.formState.isDirty;
  const isTemplate = resource.name === 'templates';

  const onSubmit = (values: Record<string, unknown>) => {
    const title = String(values[resource.fields[0].key] ?? '');
    toast.success(`${isNew ? 'Skapade' : 'Sparade'} ${resource.label.toLowerCase()} "${title}" (PoC – inget sparas på riktigt).`);
    router.push(`/poc/${resource.name}`);
  };

  const title = String(initial?.[resource.fields[0].key] ?? '');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex max-w-xl flex-col gap-6">
        {resource.fields.map((field) => {
          const disabled = !isNew && field.lockedOnEdit;
          return (
            <FormField
              key={field.key}
              control={form.control}
              name={field.key}
              rules={field.required ? { required: `${field.label} är obligatoriskt` } : undefined}
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
                      {field.required && ' *'}
                    </FormLabel>
                    {field.type === 'select' ? (
                      <Select onValueChange={rhf.onChange} value={(rhf.value as string) ?? ''} disabled={disabled}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Välj ett alternativ" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {field.options?.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : field.type === 'textarea' || field.type === 'code' ? (
                      <FormControl>
                        <Textarea
                          {...rhf}
                          value={(rhf.value as string) ?? ''}
                          disabled={disabled}
                          rows={field.type === 'code' ? 8 : 3}
                          className={field.type === 'code' ? 'font-mono text-[0.85em]' : undefined}
                        />
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
          <Button type="button" variant="outline" onClick={() => router.push(`/poc/${resource.name}`)}>
            Avbryt
          </Button>

          {isTemplate && (
            <>
              <Button type="button" variant="ghost" onClick={() => toast('Exporterar mall som JSON (PoC).')}>
                <Download className="size-4" />
                Exportera
              </Button>
              <Button type="button" variant="ghost" onClick={() => toast('Genererar PDF-förhandsvisning (PoC).')}>
                <Eye className="size-4" />
                Förhandsgranska
              </Button>
              {!isNew && (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-emerald-600"
                  onClick={() => toast.success('Mallen godkänd för produktion (PoC).')}
                >
                  <ShieldCheck className="size-4" />
                  Godkänn för produktion
                </Button>
              )}
            </>
          )}

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
                  <AlertDialogAction
                    onClick={() => {
                      toast.success(`${title} togs bort (PoC – ingen riktig radering).`);
                      router.push(`/poc/${resource.name}`);
                    }}
                  >
                    Ta bort
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </form>
    </Form>
  );
}
