import { labelsForSave } from '@admin/label-editor';
import { normalizeResourceValues } from '@admin/resource-form-values';
import type { NamespaceSubmissionApi } from './namespace-submission-api';
import { emailIntegrationWizardFields, metadataKeyField, namespaceConfigFields } from './namespace-wizard-fields';
import type {
  FormValues,
  MetadataResourceName,
  MetadataRow,
  NamespaceWizardDraft,
  SubmissionTask,
} from './namespace-wizard-types';

/**
 * One runner per task kind. Each checks what already exists first, so running a task
 * again after a failure or a reload never creates anything twice.
 */

export interface TaskOutcome {
  status: 'done' | 'skipped';
  message?: string;
}

export interface SubmissionRunContext {
  api: NamespaceSubmissionApi;
  municipalityId: number;
  namespace: string;
  /** Existing keys per metadata resource, listed once per run. */
  existingMetadataKeys: Map<MetadataResourceName, Promise<Set<string>>>;
}

/** Drops blank strings and trims the rest, so optional fields are left out instead of sent empty. */
export function withoutBlankStrings(values: FormValues): FormValues {
  return Object.fromEntries(
    Object.entries(values)
      .map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])
      .filter(([, value]) => value !== '' && value !== undefined && value !== null)
  );
}

export const namespacePayload = (draft: NamespaceWizardDraft): FormValues =>
  withoutBlankStrings(normalizeResourceValues({ fields: namespaceConfigFields() }, draft.namespaceConfig));

export const metadataPayload = (row: MetadataRow, namespace: string): FormValues => ({
  ...withoutBlankStrings(row),
  namespace,
});

export const emailIntegrationPayload = (draft: NamespaceWizardDraft): FormValues =>
  withoutBlankStrings(
    normalizeResourceValues(
      { fields: emailIntegrationWizardFields(draft.statuses, draft.roles) },
      draft.emailIntegration.values
    )
  );

async function runNamespaceTask(
  draft: NamespaceWizardDraft,
  context: SubmissionRunContext,
  isFirstAttempt: boolean
): Promise<TaskOutcome> {
  const existingNamespaces = await context.api.listNamespaces(context.municipalityId);
  if (existingNamespaces.includes(context.namespace)) {
    // On a first attempt it belongs to someone else; on a retry it is the one an earlier attempt created.
    if (isFirstAttempt) throw new Error(`Namespace ${context.namespace} finns redan.`);
    return { status: 'done', message: 'Skapades vid ett tidigare försök.' };
  }
  await context.api.createNamespace(context.municipalityId, namespacePayload(draft));
  return { status: 'done' };
}

const existingKeysFor = (resourceName: MetadataResourceName, context: SubmissionRunContext) => {
  let keys = context.existingMetadataKeys.get(resourceName);
  if (!keys) {
    keys = context.api
      .listMetadataKeys(resourceName, context.municipalityId, context.namespace)
      .then((list) => new Set(list));
    context.existingMetadataKeys.set(resourceName, keys);
  }
  return keys;
};

async function runMetadataTask(
  task: SubmissionTask,
  draft: NamespaceWizardDraft,
  context: SubmissionRunContext
): Promise<TaskOutcome> {
  const resourceName = task.resourceName as MetadataResourceName;
  const itemKey = task.itemKey ?? '';
  const existingKeys = await existingKeysFor(resourceName, context);
  if (existingKeys.has(itemKey)) return { status: 'skipped', message: 'Fanns redan.' };

  const keyField = metadataKeyField(resourceName);
  const row = draft[resourceName].find((candidate) => candidate[keyField]?.trim() === itemKey);
  if (!row) throw new Error(`${task.label} finns inte längre i guiden.`);
  await context.api.createMetadata(resourceName, context.municipalityId, metadataPayload(row, context.namespace));
  existingKeys.add(itemKey);
  return { status: 'done' };
}

async function runLabelsTask(draft: NamespaceWizardDraft, context: SubmissionRunContext): Promise<TaskOutcome> {
  const existingLabels = await context.api.getLabels(context.municipalityId, context.namespace);
  // Same rule as the labels page: the first save creates the structure, later ones replace it.
  await context.api.saveLabels(
    context.municipalityId,
    context.namespace,
    labelsForSave(draft.labels),
    existingLabels.length === 0
  );
  return { status: 'done' };
}

async function runEmailIntegrationTask(
  draft: NamespaceWizardDraft,
  context: SubmissionRunContext
): Promise<TaskOutcome> {
  const payload = emailIntegrationPayload(draft);
  if (await context.api.hasEmailIntegration(context.municipalityId, context.namespace)) {
    await context.api.updateEmailIntegration(context.municipalityId, context.namespace, payload);
  } else {
    await context.api.createEmailIntegration(context.municipalityId, { ...payload, namespace: context.namespace });
  }
  return { status: 'done' };
}

export function runSubmissionTask(
  task: SubmissionTask,
  draft: NamespaceWizardDraft,
  context: SubmissionRunContext
): Promise<TaskOutcome> {
  switch (task.kind) {
    case 'namespace':
      return runNamespaceTask(draft, context, task.attempts === 0);
    case 'metadata':
      return runMetadataTask(task, draft, context);
    case 'labels':
      return runLabelsTask(draft, context);
    case 'emailIntegration':
      return runEmailIntegrationTask(draft, context);
  }
}
