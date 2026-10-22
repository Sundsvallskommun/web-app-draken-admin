import * as React from 'react';
import { useNamespaceWizard } from './namespace-wizard-context';
import { NamespaceWizardProvider } from './namespace-wizard-provider';
import { stepIndex, WIZARD_STEPS } from './namespace-wizard-steps';
import { validateStep } from './namespace-wizard-validation';
import type { WizardStepId } from './namespace-wizard-types';
import { ContactReasonsAndLabelsStep } from './steps/contact-reasons-and-labels-step';
import { EmailIntegrationStep } from './steps/email-integration-step';
import { NamespaceConfigStep } from './steps/namespace-config-step';
import { ReviewStep } from './steps/review-step';
import { StatusesAndRolesStep } from './steps/statuses-and-roles-step';
import { WizardBanners } from './wizard-banners';
import { WizardStepFooter } from './wizard-step-footer';
import { WizardStepper, type WizardStepState } from './wizard-stepper';

const STEP_COMPONENTS: Record<WizardStepId, () => React.JSX.Element> = {
  namespace: NamespaceConfigStep,
  statusesAndRoles: StatusesAndRolesStep,
  contactReasonsAndLabels: ContactReasonsAndLabelsStep,
  emailIntegration: EmailIntegrationStep,
  review: ReviewStep,
};

function NamespaceWizardSteps() {
  const { state, goToStep, goToPreviousStep, validationContext, formRevision, submission } = useNamespaceWizard();
  const { currentStepId, visitedStepIds, draft } = state;

  const validSteps = React.useMemo(
    () =>
      Object.fromEntries(
        WIZARD_STEPS.map((step) => [step.id, validateStep(step.id, draft, validationContext).length === 0])
      ) as Record<WizardStepId, boolean>,
    [draft, validationContext]
  );

  const stepStates = Object.fromEntries(
    WIZARD_STEPS.map((step): [WizardStepId, WizardStepState] => {
      if (step.id === currentStepId) return [step.id, 'current'];
      if (!visitedStepIds.includes(step.id)) return [step.id, 'upcoming'];
      return [step.id, validSteps[step.id] ? 'complete' : 'invalid'];
    })
  ) as Record<WizardStepId, WizardStepState>;

  // A step can be opened once visited, or when every step before it is valid.
  const isSelectable = (stepId: WizardStepId) =>
    !submission.running &&
    (visitedStepIds.includes(stepId) || WIZARD_STEPS.slice(0, stepIndex(stepId)).every((step) => validSteps[step.id]));

  const currentStep = WIZARD_STEPS[stepIndex(currentStepId)];
  const StepComponent = STEP_COMPONENTS[currentStepId];

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <WizardStepper steps={WIZARD_STEPS} stepStates={stepStates} isSelectable={isSelectable} onStepSelect={goToStep} />

      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <WizardBanners />
        <div>
          <h2 className="text-lg font-semibold">{currentStep.title}</h2>
          <p className="text-sm text-muted-foreground">{currentStep.description}</p>
        </div>
        <StepComponent key={`${currentStepId}-${formRevision}`} />
        {currentStepId !== 'review' && (
          <WizardStepFooter canGoBack={stepIndex(currentStepId) > 0} onBack={goToPreviousStep} />
        )}
      </div>
    </div>
  );
}

/** Guided setup of a new namespace: everything is collected first and created in order at the end. */
export function NamespaceWizard() {
  return (
    <NamespaceWizardProvider>
      <NamespaceWizardSteps />
    </NamespaceWizardProvider>
  );
}
