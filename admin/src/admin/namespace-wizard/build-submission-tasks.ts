import { EMAIL_STATUS_FIELD_KEYS, METADATA_ITEM_LABELS, metadataKeyField } from './namespace-wizard-fields';
import type {
  MetadataResourceName,
  NamespaceWizardDraft,
  SubmissionTask,
  SubmissionTaskStatus,
} from './namespace-wizard-types';

export const NAMESPACE_TASK_ID = 'namespace';
export const LABELS_TASK_ID = 'labels';
export const EMAIL_INTEGRATION_TASK_ID = 'emailIntegration';

/** Create order; email integration last since it references statuses and roles by name. */
const METADATA_ORDER: MetadataResourceName[] = ['statuses', 'roles', 'contactReasons'];

export const metadataTaskId = (resourceName: MetadataResourceName, itemKey: string) => `${resourceName}:${itemKey}`;

export const isSettledTask = (task: SubmissionTask | undefined) =>
  task?.status === 'done' || task?.status === 'skipped';

type TaskSpec = Omit<SubmissionTask, 'status' | 'attempts'> & { skipReason?: string };

/**
 * A task keeps its outcome from an earlier run when it already succeeded, so a retry only
 * runs what failed. Failed and blocked tasks start over as pending.
 */
function withPreviousOutcome(spec: TaskSpec, previous: SubmissionTask | undefined): SubmissionTask {
  const { skipReason, ...task } = spec;
  if (previous && isSettledTask(previous)) {
    return { ...task, status: previous.status, attempts: previous.attempts, message: previous.message };
  }
  const status: SubmissionTaskStatus = skipReason ? 'skipped' : 'pending';
  return { ...task, status, attempts: previous?.attempts ?? 0, message: skipReason };
}

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

/** The ordered create tasks for a draft. `previousTasks` are the tasks of an earlier run, if any. */
export function buildSubmissionTasks(
  draft: NamespaceWizardDraft,
  previousTasks: SubmissionTask[] = []
): SubmissionTask[] {
  const previousById = new Map(previousTasks.map((task) => [task.id, task]));
  const namespace = text(draft.namespaceConfig.namespace);
  const specs: TaskSpec[] = [
    { id: NAMESPACE_TASK_ID, kind: 'namespace', label: `Namespace ${namespace}`, dependsOn: [] },
  ];

  METADATA_ORDER.forEach((resourceName) => {
    const keyField = metadataKeyField(resourceName);
    draft[resourceName].forEach((row) => {
      const itemKey = text(row[keyField]);
      if (!itemKey) return;
      specs.push({
        id: metadataTaskId(resourceName, itemKey),
        kind: 'metadata',
        resourceName,
        itemKey,
        label: `${METADATA_ITEM_LABELS[resourceName].singular} ${itemKey}`,
        dependsOn: [NAMESPACE_TASK_ID],
      });
    });
  });

  specs.push({
    id: LABELS_TASK_ID,
    kind: 'labels',
    label: 'Etiketter',
    dependsOn: [NAMESPACE_TASK_ID],
    skipReason: draft.labels.length === 0 ? 'Inga etiketter att skapa.' : undefined,
  });

  const emailValues = draft.emailIntegration.values;
  const referencedStatuses = EMAIL_STATUS_FIELD_KEYS.map((key) => text(emailValues[key])).filter(Boolean);
  const stakeholderRole = text(emailValues.stakeholderRole);
  specs.push({
    id: EMAIL_INTEGRATION_TASK_ID,
    kind: 'emailIntegration',
    label: 'E-postintegration',
    dependsOn: [
      NAMESPACE_TASK_ID,
      ...new Set(referencedStatuses.map((status) => metadataTaskId('statuses', status))),
      ...(stakeholderRole ? [metadataTaskId('roles', stakeholderRole)] : []),
    ],
    skipReason: draft.emailIntegration.configure ? undefined : 'Ingen e-postintegration vald.',
  });

  return specs.map((spec) => withPreviousOutcome(spec, previousById.get(spec.id)));
}
