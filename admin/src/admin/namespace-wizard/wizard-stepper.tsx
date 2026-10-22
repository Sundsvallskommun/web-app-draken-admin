import { cn } from '@utils/cn';
import { Check, CircleAlert } from 'lucide-react';
import type { WizardStep } from './namespace-wizard-steps';
import type { WizardStepId } from './namespace-wizard-types';

export type WizardStepState = 'complete' | 'current' | 'upcoming' | 'invalid';

const stateLabel: Record<WizardStepState, string> = {
  complete: 'klart',
  current: 'pågår',
  upcoming: 'kommande',
  invalid: 'behöver åtgärdas',
};

function StepMarker({ state, number }: { state: WizardStepState; number: number }) {
  return (
    <span
      className={cn(
        'flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
        state === 'current' && 'border-primary bg-primary text-primary-foreground',
        state === 'complete' && 'border-primary text-primary',
        state === 'invalid' && 'border-destructive text-destructive',
        state === 'upcoming' && 'text-muted-foreground'
      )}
    >
      {state === 'complete' ?
        <Check className="size-4" />
      : state === 'invalid' ?
        <CircleAlert className="size-4" />
      : number}
    </span>
  );
}

export function WizardStepper({
  steps,
  stepStates,
  isSelectable,
  onStepSelect,
}: {
  steps: WizardStep[];
  stepStates: Record<WizardStepId, WizardStepState>;
  isSelectable: (stepId: WizardStepId) => boolean;
  onStepSelect: (stepId: WizardStepId) => void;
}) {
  return (
    <nav aria-label="Steg i guiden" className="lg:w-64 lg:shrink-0">
      <ol className="flex gap-1 overflow-x-auto lg:flex-col">
        {steps.map((step, index) => {
          const state = stepStates[step.id];
          return (
            <li key={step.id} className="shrink-0">
              <button
                type="button"
                className={cn(
                  'flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm transition-colors',
                  'hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent',
                  state === 'current' && 'bg-accent font-medium'
                )}
                aria-current={state === 'current' ? 'step' : undefined}
                disabled={!isSelectable(step.id)}
                onClick={() => onStepSelect(step.id)}
              >
                <StepMarker state={state} number={index + 1} />
                <span className="hidden sm:inline">{step.title}</span>
                <span className="sr-only">({stateLabel[state]})</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
