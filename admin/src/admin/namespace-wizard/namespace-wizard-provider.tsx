import { useLocalStorage } from '@utils/use-localstorage.hook';
import * as React from 'react';
import { NamespaceWizardContext, type NamespaceWizardContextValue } from './namespace-wizard-context';
import { createInitialState, namespaceWizardReducer } from './namespace-wizard-reducer';
import { nextStepId, previousStepId } from './namespace-wizard-steps';
import type { NamespaceTemplate, NamespaceWizardDraft, WizardStepId } from './namespace-wizard-types';
import { submissionLocks } from './submission-locks';
import { useExistingNamespaces } from './use-existing-namespaces';
import { useNamespaceSubmission } from './use-namespace-submission';
import { usePersistedWizardState } from './use-persisted-wizard-state';

export function NamespaceWizardProvider({ children }: { children: React.ReactNode }) {
  const liveMunicipalityId = useLocalStorage((s) => s.municipalityId);
  const [state, dispatch] = React.useReducer(namespaceWizardReducer, liveMunicipalityId, createInitialState);
  const [formRevision, setFormRevision] = React.useState(0);
  const { ready, restored, dismissRestored } = usePersistedWizardState(state, dispatch);
  const { existing, supportManagementNamespaces } = useExistingNamespaces();
  const submission = useNamespaceSubmission(state, dispatch);

  const locks = React.useMemo(() => submissionLocks(state.submission.tasks), [state.submission.tasks]);
  const createdNamespace = locks.namespace ? String(state.draft.namespaceConfig.namespace ?? '') : undefined;

  const goToStep = React.useCallback((stepId: WizardStepId) => dispatch({ type: 'stepSelected', stepId }), []);

  const value: NamespaceWizardContextValue = {
    state,
    dispatch,
    updateDraft: (changes: Partial<NamespaceWizardDraft>) => dispatch({ type: 'draftUpdated', changes }),
    goToStep,
    goToNextStep: () => goToStep(nextStepId(state.currentStepId)),
    goToPreviousStep: () => goToStep(previousStepId(state.currentStepId)),
    applyTemplate: (templateNamespace: string, template: NamespaceTemplate) => {
      dispatch({ type: 'templateApplied', templateNamespace, template });
      setFormRevision((revision) => revision + 1);
    },
    resetWizard: () => {
      dispatch({ type: 'reset', municipalityId: liveMunicipalityId });
      dismissRestored();
      setFormRevision((revision) => revision + 1);
    },
    validationContext: { existing, createdNamespace },
    supportManagementNamespaces,
    locks,
    liveMunicipalityId,
    formRevision,
    restoredDraft: restored,
    dismissRestoredDraft: dismissRestored,
    submission,
  };

  // Render the steps only after a saved draft had the chance to load, so forms start from it.
  return <NamespaceWizardContext.Provider value={value}>{ready ? children : null}</NamespaceWizardContext.Provider>;
}
