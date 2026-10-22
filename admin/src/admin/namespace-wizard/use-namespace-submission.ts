import * as React from 'react';
import { buildSubmissionTasks } from './build-submission-tasks';
import { namespaceSubmissionApi } from './namespace-submission-api';
import type { NamespaceWizardAction, NamespaceWizardState } from './namespace-wizard-types';
import { runNamespaceSubmission } from './run-namespace-submission';

/** Starts (or retries) the create run and warns before leaving the page while it is running. */
export function useNamespaceSubmission(state: NamespaceWizardState, dispatch: React.Dispatch<NamespaceWizardAction>) {
  const runningRef = React.useRef(false);
  const running = state.submission.phase === 'running';

  const run = React.useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    const tasks = buildSubmissionTasks(state.draft, state.submission.tasks);
    dispatch({ type: 'submissionStarted', tasks });
    try {
      await runNamespaceSubmission({
        draft: state.draft,
        tasks,
        api: namespaceSubmissionApi,
        onTaskUpdate: (taskId, changes) => dispatch({ type: 'taskUpdated', taskId, changes }),
      });
    } finally {
      dispatch({ type: 'submissionFinished' });
      runningRef.current = false;
    }
  }, [dispatch, state.draft, state.submission.tasks]);

  React.useEffect(() => {
    if (!running) return;
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warnBeforeLeaving);
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving);
  }, [running]);

  return { run, running };
}
