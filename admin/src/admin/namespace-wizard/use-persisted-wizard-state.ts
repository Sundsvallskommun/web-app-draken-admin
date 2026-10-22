import * as React from 'react';
import { isSettledTask } from './build-submission-tasks';
import { createInitialState, isHydratableState } from './namespace-wizard-reducer';
import type { NamespaceWizardAction, NamespaceWizardState } from './namespace-wizard-types';

const STORAGE_KEY = `${process.env.NEXT_PUBLIC_APP_NAME}-namespace-wizard`;
const SAVE_DELAY_MS = 300;

const isPristine = (state: NamespaceWizardState) =>
  JSON.stringify(state) === JSON.stringify(createInitialState(state.draft.municipalityId));

const isCompleted = (state: NamespaceWizardState) =>
  state.submission.phase === 'finished' &&
  state.submission.tasks.length > 0 &&
  state.submission.tasks.every(isSettledTask);

/**
 * Keeps the wizard in sessionStorage, so a reload, a login redirect or a failed run can
 * be resumed. Nothing is kept for an untouched wizard or once everything is created.
 */
export function usePersistedWizardState(state: NamespaceWizardState, dispatch: React.Dispatch<NamespaceWizardAction>) {
  const [ready, setReady] = React.useState(false);
  const [restored, setRestored] = React.useState(false);

  React.useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem(STORAGE_KEY);
      const parsed: unknown = saved ? JSON.parse(saved) : null;
      if (isHydratableState(parsed)) {
        dispatch({ type: 'hydrated', state: parsed });
        setRestored(true);
      }
    } catch {
      // Storage unavailable or corrupt: start a fresh wizard.
    }
    setReady(true);
  }, [dispatch]);

  React.useEffect(() => {
    if (!ready) return;
    const timeout = window.setTimeout(() => {
      try {
        if (isPristine(state) || isCompleted(state)) window.sessionStorage.removeItem(STORAGE_KEY);
        else window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        // Not being able to save the draft only loses the resume feature.
      }
    }, SAVE_DELAY_MS);
    return () => window.clearTimeout(timeout);
  }, [ready, state]);

  const dismissRestored = React.useCallback(() => setRestored(false), []);

  return { ready, restored, dismissRestored };
}
