import { buildSubmissionTasks } from '../build-submission-tasks';
import { createInitialDraft } from '../namespace-wizard-reducer';
import { runNamespaceSubmission } from '../run-namespace-submission';

const draftWith = (changes = {}) => ({
  ...createInitialDraft(2281),
  namespaceConfig: {
    namespace: 'NEW_NS',
    displayName: 'Nytt',
    shortCode: 'NN',
    notificationTTLInDays: 40,
    accessControl: false,
    notifyReporter: false,
  },
  statuses: [{ name: 'NEW', displayName: 'Ny', externalDisplayName: '' }],
  roles: [{ name: 'CONTACT', displayName: 'Kontakt' }],
  contactReasons: [{ reason: 'PHONE', displayName: '' }],
  labels: [{ classification: 'CATEGORY', resourceName: 'HOUSING', displayName: 'Boende', labels: [] }],
  emailIntegration: {
    configure: true,
    values: {
      enabled: true,
      statusForNew: 'NEW',
      triggerStatusChangeOn: '',
      stakeholderRole: 'CONTACT',
      addSenderAsStakeholder: true,
      ignoreAutoReply: true,
      ignoreNoReply: true,
      errandNewEmailBody: { plainText: 'Hej', markup: '<p>Hej</p>' },
      daysOfInactivityBeforeReject: '',
    },
  },
  ...changes,
});

const fakeApi = (overrides = {}) => {
  const calls = [];
  const record =
    (name, result) =>
    async (...args) => {
      calls.push([name, ...args]);
      return typeof result === 'function' ? result(...args) : result;
    };
  return {
    calls,
    api: {
      listNamespaces: record('listNamespaces', []),
      createNamespace: record('createNamespace', undefined),
      listMetadataKeys: record('listMetadataKeys', []),
      createMetadata: record('createMetadata', undefined),
      getLabels: record('getLabels', []),
      saveLabels: record('saveLabels', undefined),
      hasEmailIntegration: record('hasEmailIntegration', false),
      createEmailIntegration: record('createEmailIntegration', undefined),
      updateEmailIntegration: record('updateEmailIntegration', undefined),
      ...overrides,
    },
  };
};

const run = (draft, tasks, api) => runNamespaceSubmission({ draft, tasks, api, onTaskUpdate: jest.fn() });

const statusOf = (tasks, id) => tasks.find((task) => task.id === id)?.status;

describe('runNamespaceSubmission', () => {
  it('creates everything in order with the payloads the backend expects', async () => {
    const draft = draftWith();
    const { api, calls } = fakeApi();

    const tasks = await run(draft, buildSubmissionTasks(draft), api);

    expect(tasks.every((task) => task.status === 'done')).toBe(true);
    const writes = calls.filter(([name]) => name.startsWith('create') || name === 'saveLabels');
    expect(writes).toEqual([
      [
        'createNamespace',
        2281,
        {
          namespace: 'NEW_NS',
          displayName: 'Nytt',
          shortCode: 'NN',
          notificationTTLInDays: 40,
          accessControl: false,
          notifyReporter: false,
        },
      ],
      ['createMetadata', 'statuses', 2281, { name: 'NEW', displayName: 'Ny', namespace: 'NEW_NS' }],
      ['createMetadata', 'roles', 2281, { name: 'CONTACT', displayName: 'Kontakt', namespace: 'NEW_NS' }],
      ['createMetadata', 'contactReasons', 2281, { reason: 'PHONE', namespace: 'NEW_NS' }],
      [
        'saveLabels',
        2281,
        'NEW_NS',
        [{ classification: 'CATEGORY', resourceName: 'HOUSING', displayName: 'Boende', labels: [] }],
        true,
      ],
      [
        'createEmailIntegration',
        2281,
        {
          enabled: true,
          statusForNew: 'NEW',
          stakeholderRole: 'CONTACT',
          addSenderAsStakeholder: true,
          ignoreAutoReply: true,
          ignoreNoReply: true,
          errandNewEmailTemplate: 'Hej',
          errandNewEmailHTMLTemplate: '<p>Hej</p>',
          namespace: 'NEW_NS',
        },
      ],
    ]);
  });

  it('refuses to write into a namespace that already existed before the first attempt', async () => {
    const draft = draftWith();
    const { api, calls } = fakeApi({ listNamespaces: async () => ['NEW_NS'] });

    const tasks = await run(draft, buildSubmissionTasks(draft), api);

    expect(tasks[0]).toMatchObject({ status: 'failed', message: 'Namespace NEW_NS finns redan.' });
    expect(statusOf(tasks, 'statuses:NEW')).toBe('blocked');
    expect(calls.some(([name]) => name.startsWith('create'))).toBe(false);
  });

  it('treats an existing namespace as its own on a retry', async () => {
    const draft = draftWith();
    const previous = buildSubmissionTasks(draft).map((task) =>
      task.id === 'namespace' ? { ...task, status: 'failed', attempts: 1 } : task
    );
    const { api, calls } = fakeApi({ listNamespaces: async () => ['NEW_NS'] });

    const tasks = await run(draft, buildSubmissionTasks(draft, previous), api);

    expect(tasks[0]).toMatchObject({ status: 'done', attempts: 2 });
    expect(calls.some(([name]) => name === 'createNamespace')).toBe(false);
  });

  it('blocks only the tasks that depend on a failed one', async () => {
    const draft = draftWith();
    const { api } = fakeApi({
      createMetadata: async (resourceName, municipalityId, payload) => {
        if (payload.name === 'NEW') throw { response: { data: { message: 'Ogiltig status' } } };
      },
    });

    const tasks = await run(draft, buildSubmissionTasks(draft), api);

    expect(tasks.find((task) => task.id === 'statuses:NEW')).toMatchObject({
      status: 'failed',
      message: 'Ogiltig status',
    });
    expect(statusOf(tasks, 'contactReasons:PHONE')).toBe('done');
    expect(statusOf(tasks, 'labels')).toBe('done');
    expect(tasks.find((task) => task.id === 'emailIntegration')).toMatchObject({
      status: 'blocked',
      message: 'Väntar på: Status NEW.',
    });
  });

  it('on retry runs only what is left and skips metadata that already exists', async () => {
    const draft = draftWith();
    const previous = buildSubmissionTasks(draft).map((task) =>
      task.id === 'namespace' || task.id === 'roles:CONTACT' ? { ...task, status: 'done', attempts: 1 }
      : task.id === 'statuses:NEW' ? { ...task, status: 'failed', attempts: 1 }
      : task
    );
    const { api, calls } = fakeApi({
      listMetadataKeys: async (resourceName) => (resourceName === 'statuses' ? ['NEW'] : []),
      getLabels: async () => [{ classification: 'CATEGORY', resourceName: 'HOUSING', labels: [] }],
      hasEmailIntegration: async () => true,
    });

    const tasks = await run(draft, buildSubmissionTasks(draft, previous), api);

    expect(statusOf(tasks, 'statuses:NEW')).toBe('skipped');
    expect(calls.some(([name]) => name === 'listNamespaces')).toBe(false);
    expect(calls.filter(([name]) => name === 'createMetadata').map(([, resourceName]) => resourceName)).toEqual([
      'contactReasons',
    ]);
    expect(calls.find(([name]) => name === 'saveLabels')[4]).toBe(false);
    expect(calls.some(([name]) => name === 'updateEmailIntegration')).toBe(true);
    expect(calls.some(([name]) => name === 'createEmailIntegration')).toBe(false);
  });
});
