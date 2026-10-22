import * as React from 'react';
import { useNamespaceWizard } from './namespace-wizard-context';
import { validateStep } from './namespace-wizard-validation';
import type { WizardStepId } from './namespace-wizard-types';

/** Submit handler for steps without a react-hook-form form: next step when valid, otherwise show the errors. */
export function useStepSubmit(stepId: WizardStepId) {
  const { state, validationContext, goToNextStep } = useNamespaceWizard();
  const [showErrors, setShowErrors] = React.useState(false);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Submits from dialogs rendered in portals bubble through the React tree; they are not this step's.
    if (event.target !== event.currentTarget) return;
    if (validateStep(stepId, state.draft, validationContext).length === 0) goToNextStep();
    else setShowErrors(true);
  };

  return { showErrors, onSubmit };
}
