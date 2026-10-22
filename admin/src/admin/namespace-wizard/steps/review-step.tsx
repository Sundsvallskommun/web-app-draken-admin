import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@components/ui/alert-dialog';
import { Button } from '@components/ui/button';
import { useAdminEnvironment } from '@utils/use-is-production-env.hook';
import { CircleCheck, Loader2, Plus, RotateCcw, TriangleAlert } from 'lucide-react';
import NextLink from 'next/link';
import * as React from 'react';
import { isSettledTask } from '../build-submission-tasks';
import { useNamespaceWizard } from '../namespace-wizard-context';
import { WIZARD_STEPS } from '../namespace-wizard-steps';
import { validateStep } from '../namespace-wizard-validation';
import { DraftSummary } from '../review/draft-summary';
import { SubmissionProgress } from '../review/submission-progress';

function ProblemList({ problems }: { problems: string[] }) {
  return (
    <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      <p className="mb-1 flex items-center gap-2 font-medium">
        <TriangleAlert className="size-4" />
        Åtgärda följande innan namespacet kan skapas:
      </p>
      <ul className="list-disc space-y-0.5 pl-6">
        {problems.map((problem) => (
          <li key={problem}>{problem}</li>
        ))}
      </ul>
    </div>
  );
}

function CompletedActions({ namespace, onCreateAnother }: { namespace: string; onCreateAnother: () => void }) {
  return (
    <div className="flex flex-col gap-4 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-4 py-3">
      <p className="flex items-center gap-2 text-sm font-medium">
        <CircleCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
        Namespacet {namespace} är skapat.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm">
          <NextLink href={`/namespaces/${namespace}`}>Öppna namespace</NextLink>
        </Button>
        <Button asChild size="sm" variant="outline">
          <NextLink href="/namespaces">Till listan</NextLink>
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCreateAnother}>
          <Plus className="size-4" />
          Skapa ett till
        </Button>
      </div>
    </div>
  );
}

export function ReviewStep() {
  const { state, validationContext, submission, liveMunicipalityId, resetWizard } = useNamespaceWizard();
  const { isProduction } = useAdminEnvironment();
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const { draft } = state;
  const tasks = state.submission.tasks;
  const namespace = String(draft.namespaceConfig.namespace ?? '');
  const problems = WIZARD_STEPS.flatMap((step) => validateStep(step.id, draft, validationContext));
  const municipalityChanged = draft.municipalityId !== liveMunicipalityId;
  const hasRun = tasks.length > 0;
  const completed = hasRun && !submission.running && tasks.every(isSettledTask);
  const canSubmit = problems.length === 0 && !municipalityChanged && !submission.running;

  const submit = () => {
    if (isProduction) setConfirmOpen(true);
    else void submission.run();
  };

  return (
    <div className="flex flex-col gap-6">
      <DraftSummary />
      {problems.length > 0 && <ProblemList problems={problems} />}
      {hasRun && <SubmissionProgress tasks={tasks} />}

      {completed ?
        <CompletedActions namespace={namespace} onCreateAnother={resetWizard} />
      : <div className="flex items-center gap-3 border-t pt-6">
          <Button type="button" onClick={submit} disabled={!canSubmit}>
            {submission.running ?
              <Loader2 className="size-4 animate-spin" />
            : hasRun ?
              <RotateCcw className="size-4" />
            : null}
            {hasRun ? 'Försök igen med det som återstår' : 'Skapa namespace'}
          </Button>
          {municipalityChanged && (
            <p className="text-sm text-muted-foreground">Byt tillbaka kommun i menyn för att kunna skapa.</p>
          )}
        </div>
      }

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Skapa {namespace} i produktion?</AlertDialogTitle>
            <AlertDialogDescription>
              Namespace kan inte tas bort efteråt. Statusar, roller och kontaktorsaker kan avvecklas på sina sidor.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={() => void submission.run()}>Skapa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
