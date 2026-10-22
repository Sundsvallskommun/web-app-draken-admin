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
import { Form } from '@components/ui/form';
import { toCategoryTypeRows } from '@admin/category-types';
import { type ResourceConfig, type ResourceRow } from '@admin/resource-config';
import { ResourceFieldControl } from '@admin/resource-field-control';
import { defaultFieldValues, normalizeResourceValues } from '@admin/resource-form-values';
import { validationRulesFor } from '@admin/resource-form-validation';
import { useNamespaces } from '@admin/use-namespaces';
import {
  createRow,
  getResourceDefaults,
  getResourceRequiredFields,
  removeRow,
  updateRow,
} from '@admin/use-resource-data';
import { errorMessage } from '@utils/error-message';
import { useLocalStorage } from '@utils/use-localstorage.hook';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/router';
import { type FieldErrors, useForm } from 'react-hook-form';
import { toast } from 'sonner';

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const fieldErrorMessage = (errors: FieldErrors<Record<string, unknown>>): string | undefined => {
  for (const error of Object.values(errors)) {
    if (isRecord(error) && typeof error.message === 'string') return error.message;
  }
  return undefined;
};

export function ResourceForm({
  resource,
  initial,
  isNew,
}: {
  resource: ResourceConfig;
  initial?: ResourceRow;
  isNew: boolean;
}) {
  const router = useRouter();
  const municipalityId = useLocalStorage((s) => s.municipalityId);
  const namespaceOptions = useNamespaces();
  const contractDefaults = getResourceDefaults(resource.name);
  const requiredFields = getResourceRequiredFields(resource.name);
  const defaultValues = defaultFieldValues(resource.fields, initial, contractDefaults);
  const form = useForm<Record<string, unknown>>({ defaultValues });
  const isDirty = form.formState.isDirty;

  const title = String(initial?.[resource.fields[0].key] ?? '');

  const onSubmit = async (values: Record<string, unknown>) => {
    const name = String(values[resource.fields[0].key] ?? '');
    const data = normalizeResourceValues(resource, values);
    try {
      if (isNew) await createRow(resource.name, municipalityId, data);
      else await updateRow(resource.name, municipalityId, initial as ResourceRow, data);
      toast.success(`${isNew ? 'Skapade' : 'Sparade'} ${resource.label.toLowerCase()} "${name}".`);
      router.push(`/${resource.name}`);
    } catch (err) {
      toast.error(`Kunde inte spara: ${errorMessage(err)}`);
    }
  };

  const onInvalid = (errors: FieldErrors<Record<string, unknown>>) => {
    toast.error(fieldErrorMessage(errors) ?? 'Kontrollera markerade fält innan du sparar.');
  };

  const onDelete = async () => {
    if (!initial) return;
    try {
      await removeRow(resource.name, municipalityId, initial);
      toast.success(`${title} togs bort.`);
      router.push(`/${resource.name}`);
    } catch (err) {
      toast.error(`Kunde inte ta bort: ${errorMessage(err)}`);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="flex max-w-xl flex-col gap-6">
        {resource.fields
          .filter((field) => !(isNew && field.hiddenOnCreate))
          .map((field) => {
            const required = field.required || requiredFields.includes(field.key);
            return (
              <ResourceFieldControl
                key={field.key}
                field={field}
                control={form.control}
                rules={validationRulesFor(field, required)}
                required={required}
                disabled={!isNew && field.lockedOnEdit}
                options={field.key === 'namespace' ? namespaceOptions : field.options}
                codeLanguage={resource.name === 'jsonSchemas' ? 'json' : 'markdown'}
                existingCategoryTypeCount={toCategoryTypeRows(initial?.[field.key]).length}
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
