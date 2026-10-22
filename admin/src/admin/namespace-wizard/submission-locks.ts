import { EMAIL_INTEGRATION_TASK_ID, isSettledTask, LABELS_TASK_ID, NAMESPACE_TASK_ID } from './build-submission-tasks';
import type { MetadataResourceName, SubmissionTask } from './namespace-wizard-types';

/** What a run has already created, and so can no longer be changed in the wizard. */
export interface SubmissionLocks {
  namespace: boolean;
  metadataKeys: Record<MetadataResourceName, ReadonlySet<string>>;
  labels: boolean;
  emailIntegration: boolean;
}

const isDone = (tasks: SubmissionTask[], taskId: string) =>
  tasks.some((task) => task.id === taskId && task.status === 'done');

export function submissionLocks(tasks: SubmissionTask[]): SubmissionLocks {
  const metadataKeys = (resourceName: MetadataResourceName) =>
    new Set(
      tasks
        .filter((task) => task.resourceName === resourceName && isSettledTask(task))
        .map((task) => task.itemKey ?? '')
    );

  return {
    namespace: isDone(tasks, NAMESPACE_TASK_ID),
    metadataKeys: {
      statuses: metadataKeys('statuses'),
      roles: metadataKeys('roles'),
      contactReasons: metadataKeys('contactReasons'),
    },
    labels: isDone(tasks, LABELS_TASK_ID),
    emailIntegration: isDone(tasks, EMAIL_INTEGRATION_TASK_ID),
  };
}
