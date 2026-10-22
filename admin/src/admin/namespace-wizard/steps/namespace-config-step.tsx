import { ResourceFieldControl } from '@admin/resource-field-control';
import { getResourceRequiredFields } from '@admin/use-resource-data';
import { Form } from '@components/ui/form';
import { useNamespaceWizard, WIZARD_STEP_FORM_ID } from '../namespace-wizard-context';
import { namespaceConfigFields } from '../namespace-wizard-fields';
import { validateNamespaceConfig } from '../namespace-wizard-validation';
import { useDraftSyncedForm } from '../use-draft-synced-form';
import { TemplateNamespacePicker } from './template-namespace-picker';

/** Namespace and short code are upper case by convention (e.g. CONTACTCENTER, KC). */
const UPPER_CASE_KEYS = ['namespace', 'shortCode'];

const toUpperCase = (value: string) => value.toUpperCase();

export function NamespaceConfigStep() {
  const { state, updateDraft, goToNextStep, validationContext, locks, submission } = useNamespaceWizard();
  const requiredFields = getResourceRequiredFields('namespaces');
  const disabled = locks.namespace || submission.running;
  const form = useDraftSyncedForm({
    defaultValues: state.draft.namespaceConfig,
    validate: (values) => validateNamespaceConfig(values, validationContext),
    onValuesChange: (namespaceConfig) => updateDraft({ namespaceConfig }),
  });

  return (
    <div className="flex flex-col gap-6">
      <TemplateNamespacePicker disabled={locks.namespace || submission.running} />

      <Form {...form}>
        <form
          id={WIZARD_STEP_FORM_ID}
          onSubmit={form.handleSubmit(goToNextStep)}
          className="flex max-w-xl flex-col gap-6"
          noValidate
        >
          {locks.namespace && (
            <p className="rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
              Namespacet är redan skapat och kan inte ändras här längre.
            </p>
          )}
          {namespaceConfigFields().map((field) => (
            <ResourceFieldControl
              key={field.key}
              field={field}
              control={form.control}
              required={field.required || requiredFields.includes(field.key)}
              disabled={disabled}
              transformValue={UPPER_CASE_KEYS.includes(field.key) ? toUpperCase : undefined}
            />
          ))}
        </form>
      </Form>
    </div>
  );
}
