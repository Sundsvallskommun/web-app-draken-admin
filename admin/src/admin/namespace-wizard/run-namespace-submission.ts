import { errorMessage } from '@utils/error-message';
import { isSettledTask } from './build-submission-tasks';
import type { NamespaceSubmissionApi } from './namespace-submission-api';
import type { NamespaceWizardDraft, SubmissionTask } from './namespace-wizard-types';
import { runSubmissionTask, type SubmissionRunContext } from './submission-task-runners';

export interface RunNamespaceSubmissionOptions {
  draft: NamespaceWizardDraft;
  tasks: SubmissionTask[];
  api: NamespaceSubmissionApi;
  onTaskUpdate: (taskId: string, changes: Partial<SubmissionTask>) => void;
}

/**
 * Runs the tasks one at a time in order. Done and skipped tasks are passed over, and a
 * task whose dependencies did not succeed is blocked instead of run. Returns the final tasks.
 */
export async function runNamespaceSubmission({
  draft,
  tasks,
  api,
  onTaskUpdate,
}: RunNamespaceSubmissionOptions): Promise<SubmissionTask[]> {
  const tasksById = new Map(tasks.map((task) => [task.id, task]));
  const updateTask = (task: SubmissionTask, changes: Partial<SubmissionTask>) => {
    const updatedTask = { ...task, ...changes };
    tasksById.set(task.id, updatedTask);
    onTaskUpdate(task.id, changes);
    return updatedTask;
  };

  const context: SubmissionRunContext = {
    api,
    municipalityId: draft.municipalityId,
    namespace: String(draft.namespaceConfig.namespace ?? '').trim(),
    existingMetadataKeys: new Map(),
  };

  for (const task of tasks) {
    if (isSettledTask(task)) continue;

    const unmetDependencies = task.dependsOn.filter((dependencyId) => !isSettledTask(tasksById.get(dependencyId)));
    if (unmetDependencies.length > 0) {
      const waitingFor = unmetDependencies.map((dependencyId) => tasksById.get(dependencyId)?.label ?? dependencyId);
      updateTask(task, { status: 'blocked', message: `Väntar på: ${waitingFor.join(', ')}.` });
      continue;
    }

    const runningTask = updateTask(task, { status: 'running', attempts: task.attempts + 1, message: undefined });
    try {
      const outcome = await runSubmissionTask(task, draft, context);
      updateTask(runningTask, { status: outcome.status, message: outcome.message });
    } catch (error) {
      updateTask(runningTask, { status: 'failed', message: errorMessage(error) });
    }
  }

  return tasks.map((task) => tasksById.get(task.id) ?? task);
}
