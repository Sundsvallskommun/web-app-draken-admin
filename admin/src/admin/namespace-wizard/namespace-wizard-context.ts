import { type ResourceRow } from '@admin/resource-config';
import * as React from 'react';
import type { WizardValidationContext } from './namespace-wizard-validation';
import type {
  NamespaceTemplate,
  NamespaceWizardAction,
  NamespaceWizardDraft,
  NamespaceWizardState,
  WizardStepId,
} from './namespace-wizard-types';
import type { SubmissionLocks } from './submission-locks';

export interface NamespaceWizardContextValue {
  state: NamespaceWizardState;
  dispatch: React.Dispatch<NamespaceWizardAction>;
  updateDraft: (changes: Partial<NamespaceWizardDraft>) => void;
  goToStep: (stepId: WizardStepId) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  applyTemplate: (templateNamespace: string, template: NamespaceTemplate) => void;
  resetWizard: () => void;
  validationContext: WizardValidationContext;
  supportManagementNamespaces: ResourceRow[];
  locks: SubmissionLocks;
  /** The municipality picked in the sidebar right now, which may differ from the draft's. */
  liveMunicipalityId: number;
  /** Changes when the draft is replaced (template, reset), so step forms re-read their defaults. */
  formRevision: number;
  restoredDraft: boolean;
  dismissRestoredDraft: () => void;
  submission: { run: () => Promise<void>; running: boolean };
}

export const NamespaceWizardContext = React.createContext<NamespaceWizardContextValue | null>(null);

export function useNamespaceWizard(): NamespaceWizardContextValue {
  const context = React.useContext(NamespaceWizardContext);
  if (!context) throw new Error('useNamespaceWizard måste användas inom NamespaceWizardProvider');
  return context;
}

/** Id of the current step's form, so the shared footer can submit it. */
export const WIZARD_STEP_FORM_ID = 'namespace-wizard-step-form';
