import { LabelWorkspace } from '@admin/label-workspace';
import { useNamespaceWizard, WIZARD_STEP_FORM_ID } from '../namespace-wizard-context';
import { validateLabelTree } from '../namespace-wizard-validation';
import { useStepSubmit } from '../use-step-submit';
import { MetadataListSection } from './metadata-list-section';

export function ContactReasonsAndLabelsStep() {
  const { state, updateDraft, locks, submission } = useNamespaceWizard();
  const { showErrors, onSubmit } = useStepSubmit('contactReasonsAndLabels');
  const labelErrors = showErrors ? validateLabelTree(state.draft.labels) : [];

  return (
    <div className="flex flex-col gap-8">
      <form id={WIZARD_STEP_FORM_ID} onSubmit={onSubmit} className="max-w-3xl" noValidate>
        <MetadataListSection resourceName="contactReasons" showErrors={showErrors} />
      </form>

      {/* Outside the step form: the label dialogs have forms of their own. */}
      <section className="space-y-3" aria-labelledby="wizard-labels-heading">
        <div>
          <h3 id="wizard-labels-heading" className="text-sm font-medium">
            Etiketter
          </h3>
          <p className="text-sm text-muted-foreground">
            Hierarkin ärenden kategoriseras med, t.ex. kategori, typ och undertyp.
            {locks.labels && ' Etiketterna är redan skapade och ändras på sidan Etiketter.'}
          </p>
        </div>
        <LabelWorkspace
          labels={state.draft.labels}
          onLabelsChange={(nextLabels) => {
            updateDraft({ labels: nextLabels });
            return true;
          }}
          disabled={locks.labels || submission.running}
          canRemove
          canDeprecate={false}
        />
        {labelErrors.length > 0 && (
          <ul className="space-y-0.5 text-sm text-destructive">
            {labelErrors.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
