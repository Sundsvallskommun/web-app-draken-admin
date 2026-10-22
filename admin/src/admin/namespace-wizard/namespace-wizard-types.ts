import type { LabelNode } from '@interfaces/label';

export type WizardStepId = 'namespace' | 'statusesAndRoles' | 'contactReasonsAndLabels' | 'emailIntegration' | 'review';

/** FieldDef-driven form values, the same shape ResourceForm works with. */
export type FormValues = Record<string, unknown>;

/** The metadata lists the wizard creates one row at a time. */
export type MetadataResourceName = 'statuses' | 'roles' | 'contactReasons';

/** One status, role or contact reason, keyed by its FieldDef keys (e.g. name, displayName). */
export type MetadataRow = Record<string, string>;

export interface EmailIntegrationDraft {
  /** Off means the namespace is created without an email integration. */
  configure: boolean;
  values: FormValues;
}

export interface NamespaceWizardDraft {
  /** Captured when the wizard starts, so a municipality switch mid-way can't redirect the run. */
  municipalityId: number;
  templateNamespace: string | null;
  namespaceConfig: FormValues;
  statuses: MetadataRow[];
  roles: MetadataRow[];
  contactReasons: MetadataRow[];
  labels: LabelNode[];
  emailIntegration: EmailIntegrationDraft;
}

/** The parts of a draft that can be prefilled from an existing namespace. */
export type NamespaceTemplate = Pick<
  NamespaceWizardDraft,
  'statuses' | 'roles' | 'contactReasons' | 'labels' | 'emailIntegration'
> & { namespaceConfig: FormValues };

export type SubmissionTaskKind = 'namespace' | 'metadata' | 'labels' | 'emailIntegration';

export type SubmissionTaskStatus = 'pending' | 'running' | 'done' | 'skipped' | 'failed' | 'blocked';

export interface SubmissionTask {
  /** 'namespace', 'labels', 'emailIntegration' or `${resourceName}:${itemKey}` for metadata rows. */
  id: string;
  kind: SubmissionTaskKind;
  resourceName?: MetadataResourceName;
  itemKey?: string;
  label: string;
  dependsOn: string[];
  status: SubmissionTaskStatus;
  /** Number of times the task has been started; the namespace task uses it to tell its own namespace apart. */
  attempts: number;
  message?: string;
}

export type SubmissionPhase = 'idle' | 'running' | 'finished';

export interface NamespaceWizardState {
  schemaVersion: 1;
  currentStepId: WizardStepId;
  visitedStepIds: WizardStepId[];
  draft: NamespaceWizardDraft;
  submission: { phase: SubmissionPhase; tasks: SubmissionTask[] };
}

export type NamespaceWizardAction =
  | { type: 'draftUpdated'; changes: Partial<NamespaceWizardDraft> }
  | { type: 'templateApplied'; templateNamespace: string; template: NamespaceTemplate }
  | { type: 'stepSelected'; stepId: WizardStepId }
  | { type: 'submissionStarted'; tasks: SubmissionTask[] }
  | { type: 'taskUpdated'; taskId: string; changes: Partial<SubmissionTask> }
  | { type: 'submissionFinished' }
  | { type: 'hydrated'; state: NamespaceWizardState }
  | { type: 'reset'; municipalityId: number };

export interface ExistingNamespaces {
  namespaces: string[];
  shortCodes: { shortCode: string; namespace: string }[];
}
