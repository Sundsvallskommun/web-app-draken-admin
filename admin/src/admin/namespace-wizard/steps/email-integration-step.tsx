import { ResourceFieldControl } from '@admin/resource-field-control';
import { getResourceRequiredFields } from '@admin/use-resource-data';
import { Form } from '@components/ui/form';
import { Label } from '@components/ui/label';
import { Switch } from '@components/ui/switch';
import { useNamespaceWizard, WIZARD_STEP_FORM_ID } from '../namespace-wizard-context';
import { emailIntegrationWizardFields } from '../namespace-wizard-fields';
import { validateEmailIntegrationDraft } from '../namespace-wizard-validation';
import { useDraftSyncedForm } from '../use-draft-synced-form';

function EmailIntegrationForm({ disabled }: { disabled: boolean }) {
  const { state, updateDraft, goToNextStep } = useNamespaceWizard();
  const { statuses, roles, emailIntegration } = state.draft;
  const requiredFields = getResourceRequiredFields('emailIntegration');
  const form = useDraftSyncedForm({
    defaultValues: emailIntegration.values,
    validate: (values) => validateEmailIntegrationDraft({ configure: true, values }, statuses, roles),
    onValuesChange: (values) => updateDraft({ emailIntegration: { configure: true, values } }),
  });

  return (
    <Form {...form}>
      <form
        id={WIZARD_STEP_FORM_ID}
        onSubmit={form.handleSubmit(goToNextStep)}
        className="flex max-w-xl flex-col gap-6"
        noValidate
      >
        {emailIntegrationWizardFields(statuses, roles).map((field) => {
          const required = field.required || requiredFields.includes(field.key);
          return (
            <ResourceFieldControl
              key={field.key}
              field={field}
              control={form.control}
              required={required}
              disabled={disabled}
              allowEmptySelection={field.type === 'select' && !required}
            />
          );
        })}
      </form>
    </Form>
  );
}

export function EmailIntegrationStep() {
  const { state, updateDraft, goToNextStep, locks, submission } = useNamespaceWizard();
  const { configure, values } = state.draft.emailIntegration;
  const disabled = locks.emailIntegration || submission.running;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex max-w-xl items-center justify-between gap-4 rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label htmlFor="wizard-configure-email-integration">Skapa e-postintegration</Label>
          <p className="text-sm text-muted-foreground">
            Statusar och intressentroll väljs bland dem du lade till i steg 2.
          </p>
        </div>
        <Switch
          id="wizard-configure-email-integration"
          checked={configure}
          onCheckedChange={(checked) => updateDraft({ emailIntegration: { configure: checked, values } })}
          disabled={disabled}
        />
      </div>

      {locks.emailIntegration && (
        <p className="max-w-xl rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
          E-postintegrationen är redan skapad och ändras på sidan E-postintegration.
        </p>
      )}

      {configure ?
        <EmailIntegrationForm disabled={disabled} />
      : <form
          id={WIZARD_STEP_FORM_ID}
          onSubmit={(event) => {
            event.preventDefault();
            goToNextStep();
          }}
        >
          <p className="text-sm text-muted-foreground">
            Namespacet skapas utan e-postintegration. Den kan läggas till senare.
          </p>
        </form>
      }
    </div>
  );
}
