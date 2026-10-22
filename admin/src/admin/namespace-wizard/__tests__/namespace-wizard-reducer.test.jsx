import { createInitialState, isHydratableState, namespaceWizardReducer } from '../namespace-wizard-reducer';

describe('namespaceWizardReducer', () => {
  it('starts with the default statuses and contract defaults for the namespace', () => {
    const state = createInitialState(2281);

    expect(state.draft.municipalityId).toBe(2281);
    expect(state.draft.statuses.map((status) => status.name)).toEqual(['NEW', 'ONGOING', 'SOLVED', 'SUSPENDED']);
    expect(state.draft.namespaceConfig).toMatchObject({ namespace: '', notificationTTLInDays: 40 });
    expect(state.draft.emailIntegration).toMatchObject({ configure: false, values: { statusForNew: 'NEW' } });
  });

  it('keeps the typed identity when a template is applied', () => {
    const typed = namespaceWizardReducer(createInitialState(2281), {
      type: 'draftUpdated',
      changes: {
        namespaceConfig: { namespace: 'NEW_NS', displayName: 'Nytt', shortCode: 'NN', notificationTTLInDays: 40 },
      },
    });

    const applied = namespaceWizardReducer(typed, {
      type: 'templateApplied',
      templateNamespace: 'SOURCE',
      template: {
        namespaceConfig: { notificationTTLInDays: 10, accessControl: true },
        statuses: [{ name: 'OPEN', displayName: 'Öppen', externalDisplayName: '' }],
        roles: [],
        contactReasons: [],
        labels: [],
        emailIntegration: { configure: true, values: { enabled: false } },
      },
    });

    expect(applied.draft.templateNamespace).toBe('SOURCE');
    expect(applied.draft.namespaceConfig).toEqual({
      namespace: 'NEW_NS',
      displayName: 'Nytt',
      shortCode: 'NN',
      notificationTTLInDays: 10,
      accessControl: true,
    });
    expect(applied.draft.statuses).toEqual([{ name: 'OPEN', displayName: 'Öppen', externalDisplayName: '' }]);
  });

  it('records visited steps once', () => {
    let state = createInitialState(2281);
    state = namespaceWizardReducer(state, { type: 'stepSelected', stepId: 'statusesAndRoles' });
    state = namespaceWizardReducer(state, { type: 'stepSelected', stepId: 'namespace' });

    expect(state.currentStepId).toBe('namespace');
    expect(state.visitedStepIds).toEqual(['namespace', 'statusesAndRoles']);
  });

  it('marks a task that was running when the page reloaded as failed', () => {
    const saved = {
      ...createInitialState(2281),
      submission: {
        phase: 'running',
        tasks: [
          { id: 'namespace', kind: 'namespace', label: 'Namespace X', dependsOn: [], status: 'done', attempts: 1 },
          { id: 'labels', kind: 'labels', label: 'Etiketter', dependsOn: [], status: 'running', attempts: 1 },
        ],
      },
    };

    const hydrated = namespaceWizardReducer(createInitialState(2281), { type: 'hydrated', state: saved });

    expect(hydrated.submission.phase).toBe('finished');
    expect(hydrated.submission.tasks.map((task) => task.status)).toEqual(['done', 'failed']);
  });

  it('only hydrates drafts with the current schema version', () => {
    expect(isHydratableState(createInitialState(2281))).toBe(true);
    expect(isHydratableState({ ...createInitialState(2281), schemaVersion: 0 })).toBe(false);
    expect(isHydratableState(null)).toBe(false);
  });
});
