import { buildSubmissionTasks } from '../build-submission-tasks';
import { createInitialDraft } from '../namespace-wizard-reducer';

const draftWith = (changes = {}) => ({
  ...createInitialDraft(2281),
  namespaceConfig: { namespace: 'NEW_NS', displayName: 'Nytt', shortCode: 'NN', notificationTTLInDays: 40 },
  statuses: [
    { name: 'NEW', displayName: 'Ny', externalDisplayName: '' },
    { name: 'SOLVED', displayName: 'Löst', externalDisplayName: '' },
  ],
  roles: [{ name: 'CONTACT', displayName: 'Kontakt' }],
  contactReasons: [{ reason: 'PHONE', displayName: 'Telefon' }],
  ...changes,
});

describe('buildSubmissionTasks', () => {
  it('orders the tasks so everything a task needs is created before it', () => {
    const tasks = buildSubmissionTasks(draftWith());

    expect(tasks.map((task) => task.id)).toEqual([
      'namespace',
      'statuses:NEW',
      'statuses:SOLVED',
      'roles:CONTACT',
      'contactReasons:PHONE',
      'labels',
      'emailIntegration',
    ]);
    expect(tasks.find((task) => task.id === 'roles:CONTACT')).toMatchObject({
      label: 'Roll CONTACT',
      dependsOn: ['namespace'],
      status: 'pending',
      attempts: 0,
    });
  });

  it('skips labels and email integration when there is nothing to create', () => {
    const tasks = buildSubmissionTasks(draftWith());

    expect(tasks.find((task) => task.id === 'labels').status).toBe('skipped');
    expect(tasks.find((task) => task.id === 'emailIntegration').status).toBe('skipped');
  });

  it('makes the email integration wait for the statuses and role it references', () => {
    const draft = draftWith({
      emailIntegration: {
        configure: true,
        values: {
          statusForNew: 'NEW',
          triggerStatusChangeOn: 'SOLVED',
          statusChangeTo: 'NEW',
          stakeholderRole: 'CONTACT',
        },
      },
    });

    expect(buildSubmissionTasks(draft).find((task) => task.id === 'emailIntegration')).toMatchObject({
      status: 'pending',
      dependsOn: ['namespace', 'statuses:NEW', 'statuses:SOLVED', 'roles:CONTACT'],
    });
  });

  it('keeps finished tasks from an earlier run and resets failed ones', () => {
    const previousTasks = buildSubmissionTasks(draftWith()).map((task) =>
      task.id === 'namespace' ? { ...task, status: 'done', attempts: 1 }
      : task.id === 'statuses:NEW' ? { ...task, status: 'failed', attempts: 1, message: 'fel' }
      : task
    );

    const tasks = buildSubmissionTasks(draftWith(), previousTasks);

    expect(tasks.find((task) => task.id === 'namespace')).toMatchObject({ status: 'done', attempts: 1 });
    expect(tasks.find((task) => task.id === 'statuses:NEW')).toMatchObject({ status: 'pending', attempts: 1 });
  });

  it('ignores rows without a key', () => {
    const tasks = buildSubmissionTasks(draftWith({ roles: [{ name: '  ', displayName: 'Tom' }] }));

    expect(tasks.some((task) => task.id.startsWith('roles:'))).toBe(false);
  });
});
