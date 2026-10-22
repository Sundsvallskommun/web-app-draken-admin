import { WIZARD_STEP_FORM_ID } from '../namespace-wizard-context';
import { useStepSubmit } from '../use-step-submit';
import { MetadataListSection } from './metadata-list-section';

export function StatusesAndRolesStep() {
  const { showErrors, onSubmit } = useStepSubmit('statusesAndRoles');

  return (
    <form id={WIZARD_STEP_FORM_ID} onSubmit={onSubmit} className="flex max-w-3xl flex-col gap-8" noValidate>
      <MetadataListSection resourceName="statuses" requireAtLeastOne showErrors={showErrors} />
      <MetadataListSection resourceName="roles" showErrors={showErrors} />
    </form>
  );
}
