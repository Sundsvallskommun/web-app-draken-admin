import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { isSettledTask } from '../build-submission-tasks';
import type { SubmissionTask, SubmissionTaskStatus } from '../namespace-wizard-types';
import { SubmissionStatusIcon, SubmissionTaskRow } from './submission-task-row';

const TASK_GROUPS: { title: string; matches: (task: SubmissionTask) => boolean }[] = [
  { title: 'Namespace', matches: (task) => task.kind === 'namespace' },
  { title: 'Statusar', matches: (task) => task.resourceName === 'statuses' },
  { title: 'Roller', matches: (task) => task.resourceName === 'roles' },
  { title: 'Kontaktorsaker', matches: (task) => task.resourceName === 'contactReasons' },
  { title: 'Etiketter', matches: (task) => task.kind === 'labels' },
  { title: 'E-postintegration', matches: (task) => task.kind === 'emailIntegration' },
];

/** The status a group shows: its worst task, so one failure is never hidden by successes. */
function groupStatus(tasks: SubmissionTask[]): SubmissionTaskStatus {
  const order: SubmissionTaskStatus[] = ['failed', 'blocked', 'running', 'pending', 'done', 'skipped'];
  return order.find((status) => tasks.some((task) => task.status === status)) ?? 'pending';
}

function SubmissionTaskGroup({ title, tasks }: { title: string; tasks: SubmissionTask[] }) {
  const settledCount = tasks.filter(isSettledTask).length;
  // A single task needs no list; groups with many show only the ones that need attention or are running.
  const visibleTasks = tasks.length === 1 ? tasks : tasks.filter((task) => !isSettledTask(task) || task.message);

  return (
    <li className="py-2">
      <div className="flex items-center gap-2 text-sm">
        <SubmissionStatusIcon status={groupStatus(tasks)} />
        <span className="font-medium">{title}</span>
        <span className="ml-auto text-xs text-muted-foreground">
          {settledCount}/{tasks.length} klara
        </span>
      </div>
      {visibleTasks.length > 0 && (
        <ul className="ml-6 mt-1">
          {visibleTasks.map((task) => (
            <SubmissionTaskRow key={task.id} task={task} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function SubmissionProgress({ tasks }: { tasks: SubmissionTask[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Skapande</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="divide-y" aria-live="polite">
          {TASK_GROUPS.map((group) => {
            const groupTasks = tasks.filter(group.matches);
            return groupTasks.length > 0 ?
                <SubmissionTaskGroup key={group.title} title={group.title} tasks={groupTasks} />
              : null;
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
