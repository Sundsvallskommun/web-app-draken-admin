import { cn } from '@utils/cn';
import { Check, Clock, Loader2, MinusCircle, X } from 'lucide-react';
import type { SubmissionTask, SubmissionTaskStatus } from '../namespace-wizard-types';

const statusText: Record<SubmissionTaskStatus, string> = {
  pending: 'Väntar',
  running: 'Skapas',
  done: 'Klar',
  skipped: 'Hoppades över',
  failed: 'Misslyckades',
  blocked: 'Blockerad',
};

export function SubmissionStatusIcon({ status }: { status: SubmissionTaskStatus }) {
  const className = 'size-4 shrink-0';
  switch (status) {
    case 'running':
      return <Loader2 className={cn(className, 'animate-spin text-muted-foreground')} aria-hidden />;
    case 'done':
      return <Check className={cn(className, 'text-emerald-600 dark:text-emerald-400')} aria-hidden />;
    case 'skipped':
      return <MinusCircle className={cn(className, 'text-muted-foreground')} aria-hidden />;
    case 'failed':
    case 'blocked':
      return <X className={cn(className, 'text-destructive')} aria-hidden />;
    case 'pending':
      return <Clock className={cn(className, 'text-muted-foreground')} aria-hidden />;
  }
}

export function SubmissionTaskRow({ task }: { task: SubmissionTask }) {
  const isProblem = task.status === 'failed' || task.status === 'blocked';
  return (
    <li className="flex items-start gap-2 py-1 text-sm">
      <span className="mt-0.5">
        <SubmissionStatusIcon status={task.status} />
      </span>
      <div className="min-w-0">
        <span className="font-medium">{task.label}</span>
        <span className="sr-only">: {statusText[task.status]}</span>
        {task.message && (
          <p className={cn('text-xs', isProblem ? 'text-destructive' : 'text-muted-foreground')}>{task.message}</p>
        )}
      </div>
    </li>
  );
}
