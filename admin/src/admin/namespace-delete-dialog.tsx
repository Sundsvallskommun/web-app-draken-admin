import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@components/ui/dialog';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import type { DeletePlanEntryResponse, DeleteStepResult, NamespaceDeleteReport } from '@data-contracts/backend/data-contracts';
import { deleteNamespace } from '@services/namespace-import-service';
import { cn } from '@utils/cn';
import { useAdminEnvironment } from '@utils/use-is-production-env.hook';
import { useLocalStorage } from '@utils/use-localstorage.hook';
import { CheckCircle2, CircleAlert, Loader2, Trash2 } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

type DeleteSection = DeletePlanEntryResponse['section'];

const SECTION_LABELS: Record<DeleteSection, string> = {
  emailIntegration: 'E-postintegration',
  actionConfigs: 'Åtgärdskonfigurationer',
  phaseTransitions: 'Fasövergångar',
  phases: 'Faser',
  labels: 'Etiketter',
  labelClassifications: 'Etikettklassificeringar',
  externalIdTypes: 'Externa id-typer',
  statementOutcomes: 'Yttrandeutfall',
  decisionOutcomes: 'Beslutsutfall',
  measureTypes: 'Åtgärdstyper',
  attachmentPurposes: 'Bilagesyften',
  contactReasons: 'Kontaktorsaker',
  categories: 'Kategorier',
  roles: 'Roller',
  statuses: 'Statusar',
  namespaceConfig: 'Namespace-konfiguration',
  featureFlags: 'Feature-flaggor',
};

const STEP_STATUS: Record<DeleteStepResult['status'], { label: string; className: string }> = {
  done: { label: 'Borttagen', className: 'border-emerald-700 bg-emerald-600 text-white' },
  skipped: { label: 'Inget att ta bort', className: 'bg-secondary text-secondary-foreground' },
  failed: { label: 'Misslyckades', className: 'bg-destructive text-destructive-foreground' },
  not_run: { label: 'Ej körd', className: 'border bg-background text-muted-foreground' },
};

const OUTCOME: Record<NamespaceDeleteReport['outcome'], { title: string; description: string; ok: boolean }> = {
  disabled: {
    title: 'Borttagning är avstängd',
    description: 'Backend körs utan NAMESPACE_DELETE_ENABLED=true. Slå på inställningen och starta om backend för att kunna ta bort namespaces.',
    ok: false,
  },
  ready: { title: 'Namespacet kan tas bort', description: 'Inget har tagits bort ännu. Granska listan och bekräfta.', ok: true },
  not_found: { title: 'Namespacet finns inte', description: 'Det finns ingen namespace-konfiguration med det namnet.', ok: false },
  has_errands: {
    title: 'Namespacet har ärenden',
    description: 'Borttagning vägras så länge det finns ärenden i namespacet. Ärendena måste hanteras först.',
    ok: false,
  },
  completed: { title: 'Namespacet är borttaget', description: 'Alla delar togs bort.', ok: true },
  partial_failure: {
    title: 'Borttagningen avbröts',
    description: 'Ett steg misslyckades. Det som redan tagits bort är borta. Åtgärda felet och öppna dialogen igen för att se vad som återstår.',
    ok: false,
  },
};

const errMsg = (err: unknown): string => {
  const e = err as { response?: { data?: { message?: string } }; message?: string };
  return e?.response?.data?.message ?? e?.message ?? 'fel';
};

export function DeleteReportView({ report }: { report: NamespaceDeleteReport }) {
  const outcome = OUTCOME[report.outcome];
  const Icon = outcome.ok ? CheckCircle2 : CircleAlert;
  const executed = report.steps.length > 0;
  const planned = report.plan.filter((entry) => entry.items.length > 0);
  const total = planned.reduce((sum, entry) => sum + entry.items.length, 0);
  return (
    <div className="space-y-3">
      <div
        role="status"
        className={cn(
          'flex items-start gap-3 rounded-md border p-3 text-sm',
          outcome.ok ? 'border-emerald-700/40 bg-emerald-50 dark:bg-emerald-950/30' : 'border-destructive/40 bg-destructive/10'
        )}
      >
        <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <div>
          <p className="font-medium">{outcome.title}</p>
          <p className="text-muted-foreground">{outcome.description}</p>
          {report.outcome === 'has_errands' && (
            <p className="text-muted-foreground">
              {report.errandCount === 1 ? '1 ärende' : `${report.errandCount} ärenden`} i namespacet.
            </p>
          )}
        </div>
      </div>

      {executed ?
        <div className="max-h-72 overflow-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Del</TableHead>
                <TableHead className="w-36">Status</TableHead>
                <TableHead className="w-20 text-right">Antal</TableHead>
                <TableHead>Detaljer</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.steps.map((step) => {
                const status = STEP_STATUS[step.status];
                return (
                  <TableRow key={step.section}>
                    <TableCell>{SECTION_LABELS[step.section]}</TableCell>
                    <TableCell>
                      <Badge className={status.className}>{status.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{step.deleted.length}</TableCell>
                    <TableCell className="text-xs">
                      {step.error ?
                        <span className="text-destructive">{step.error}</span>
                      : <span className="font-mono text-muted-foreground">{step.deleted.join(', ')}</span>}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      : planned.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Tas bort ({total} delar)</h3>
            <div className="max-h-72 overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Del</TableHead>
                    <TableHead className="w-20 text-right">Antal</TableHead>
                    <TableHead>Poster</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {planned.map((entry) => (
                    <TableRow key={entry.section}>
                      <TableCell>{SECTION_LABELS[entry.section]}</TableCell>
                      <TableCell className="text-right">{entry.items.length}</TableCell>
                      <TableCell className="font-mono text-xs">{entry.items.join(', ')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )
      }
    </div>
  );
}

/**
 * The "Ta bort" button for the namespace edit form. Opening the dialog inspects the namespace
 * first (what would be deleted, whether errands block it); deleting requires typing the
 * namespace name. After a successful delete `onDeleted` is called.
 */
export function NamespaceDeleteButton({ namespace, onDeleted }: { namespace: string; onDeleted: () => void }) {
  const municipalityId = useLocalStorage((s) => s.municipalityId);
  const { isProduction } = useAdminEnvironment();
  const [open, setOpen] = React.useState(false);
  const [report, setReport] = React.useState<NamespaceDeleteReport | null>(null);
  const [busy, setBusy] = React.useState<'inspect' | 'delete' | null>(null);
  const [typed, setTyped] = React.useState('');

  const inspect = React.useCallback(async () => {
    setBusy('inspect');
    setReport(null);
    try {
      setReport(await deleteNamespace(municipalityId, namespace, true));
    } catch (err) {
      toast.error(`Kontrollen misslyckades: ${errMsg(err)}`);
      setOpen(false);
    } finally {
      setBusy(null);
    }
  }, [municipalityId, namespace]);

  const handleOpenChange = (next: boolean) => {
    if (busy === 'delete') return;
    setOpen(next);
    if (next) {
      setTyped('');
      void inspect();
    }
  };

  const run = async () => {
    setBusy('delete');
    try {
      const result = await deleteNamespace(municipalityId, namespace, false);
      setReport(result);
      if (result.outcome === 'completed') {
        toast.success(`Namespacet ${namespace} togs bort.`);
        setOpen(false);
        onDeleted();
      } else if (result.outcome === 'partial_failure') {
        toast.error('Borttagningen avbröts. Se resultatet i dialogen.');
      } else {
        toast.error('Namespacet togs inte bort. Se resultatet i dialogen.');
      }
    } catch (err) {
      toast.error(`Borttagningen misslyckades: ${errMsg(err)}`);
    } finally {
      setBusy(null);
    }
  };

  const canDelete = report?.outcome === 'ready' && typed.trim() === namespace && busy === null;
  const finished = report?.outcome === 'completed' || report?.outcome === 'partial_failure';

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        className="ml-auto text-destructive hover:text-destructive"
        onClick={() => handleOpenChange(true)}
      >
        <Trash2 className="size-4" />
        Ta bort
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-destructive">
              {isProduction ? `Ta bort ${namespace} från produktion?` : `Ta bort ${namespace}?`}
            </DialogTitle>
            <DialogDescription>
              Namespacet tas bort med all metadata, etiketter, faser, e-postintegration, konfiguration och feature-flaggor.
              Vägras om namespacet har ärenden. Kan inte ångras.
            </DialogDescription>
          </DialogHeader>

          {busy === 'inspect' && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Kontrollerar vad som skulle tas bort…
            </p>
          )}
          {report && <DeleteReportView report={report} />}

          {report?.outcome === 'ready' && (
            <div className="space-y-1.5">
              <Label htmlFor="delete-confirm">Skriv namespacets namn för att bekräfta</Label>
              <Input
                id="delete-confirm"
                value={typed}
                autoComplete="off"
                placeholder={namespace}
                disabled={busy !== null}
                onChange={(event) => setTyped(event.target.value)}
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" disabled={busy === 'delete'} onClick={() => setOpen(false)}>
              {finished ? 'Stäng' : 'Avbryt'}
            </Button>
            {!finished && (
              <Button type="button" variant="destructive" disabled={!canDelete} onClick={run}>
                {busy === 'delete' ?
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                : <Trash2 className="size-4" aria-hidden="true" />}
                Ta bort permanent
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
