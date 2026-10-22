import { DEFAULT_STATUS_NAMES } from '@admin/resource-config';
import { defaultFieldValues } from '@admin/resource-form-values';
import { getResourceDefaults } from '@admin/use-resource-data';
import { emptyMetadataRow, namespaceConfigFields } from './namespace-wizard-fields';
import { emptyEmailIntegrationDraft } from './namespace-template-mapping';
import type {
  MetadataRow,
  NamespaceWizardAction,
  NamespaceWizardDraft,
  NamespaceWizardState,
  SubmissionTask,
} from './namespace-wizard-types';

const defaultStatuses = (): MetadataRow[] =>
  DEFAULT_STATUS_NAMES.map((name) => ({ ...emptyMetadataRow('statuses'), name }));

export function createInitialDraft(municipalityId: number): NamespaceWizardDraft {
  const statuses = defaultStatuses();
  return {
    municipalityId,
    templateNamespace: null,
    namespaceConfig: defaultFieldValues(namespaceConfigFields(), undefined, getResourceDefaults('namespaces')),
    statuses,
    roles: [],
    contactReasons: [],
    labels: [],
    emailIntegration: emptyEmailIntegrationDraft(statuses),
  };
}

export function createInitialState(municipalityId: number): NamespaceWizardState {
  return {
    schemaVersion: 1,
    currentStepId: 'namespace',
    visitedStepIds: ['namespace'],
    draft: createInitialDraft(municipalityId),
    submission: { phase: 'idle', tasks: [] },
  };
}

/** A run that was interrupted (e.g. by a reload) can't still be running; mark it so it can be retried. */
const interruptedTask = (task: SubmissionTask): SubmissionTask =>
  task.status === 'running' ? { ...task, status: 'failed', message: 'Avbröts innan den hann bli klar.' } : task;

export function isHydratableState(value: unknown): value is NamespaceWizardState {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<NamespaceWizardState>;
  return (
    candidate.schemaVersion === 1 && typeof candidate.draft === 'object' && Array.isArray(candidate.visitedStepIds)
  );
}

export function namespaceWizardReducer(
  state: NamespaceWizardState,
  action: NamespaceWizardAction
): NamespaceWizardState {
  switch (action.type) {
    case 'draftUpdated':
      return { ...state, draft: { ...state.draft, ...action.changes } };

    case 'templateApplied':
      return {
        ...state,
        draft: {
          ...state.draft,
          ...action.template,
          templateNamespace: action.templateNamespace,
          // Identity fields stay as the user typed them; only settings come from the template.
          namespaceConfig: { ...state.draft.namespaceConfig, ...action.template.namespaceConfig },
        },
      };

    case 'stepSelected':
      return {
        ...state,
        currentStepId: action.stepId,
        visitedStepIds:
          state.visitedStepIds.includes(action.stepId) ?
            state.visitedStepIds
          : [...state.visitedStepIds, action.stepId],
      };

    case 'submissionStarted':
      return { ...state, submission: { phase: 'running', tasks: action.tasks } };

    case 'taskUpdated':
      return {
        ...state,
        submission: {
          ...state.submission,
          tasks: state.submission.tasks.map((task) =>
            task.id === action.taskId ? { ...task, ...action.changes } : task
          ),
        },
      };

    case 'submissionFinished':
      return { ...state, submission: { ...state.submission, phase: 'finished' } };

    case 'hydrated':
      return {
        ...action.state,
        submission: {
          phase: action.state.submission.phase === 'running' ? 'finished' : action.state.submission.phase,
          tasks: action.state.submission.tasks.map(interruptedTask),
        },
      };

    case 'reset':
      return createInitialState(action.municipalityId);
  }
}
