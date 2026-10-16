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
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/card';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import type { DeletePlanEntryResponse, DeleteStepResult, Namespace, NamespaceDeleteReport } from '@data-contracts/backend/data-contracts';
import { deleteNamespace } from '@services/namespace-import-service';
import { cn } from '@utils/cn';
import { CheckCircle2, CircleAlert, Loader2, Search, Trash2 } from 'lucide-react';
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
    description: 'Ett steg misslyckades. Det som redan tagits bort är borta. Åtgärda felet och kör "Visa vad som tas bort" igen för att se vad som återstår.',
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
  const total = report.plan.reduce((sum, entry) => sum + entry.items.length, 0);
  return (
    <div className="space-y-4">
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
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Del</TableHead>
                <TableHead className="w-40">Status</TableHead>
                <TableHead className="w-24 text-right">Borttagna</TableHead>
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
      : report.plan.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Tas bort ({total} delar)</h3>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Del</TableHead>
                    <TableHead className="w-24 text-right">Antal</TableHead>
                    <TableHead>Poster</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.plan.map((entry) => (
                    <TableRow key={entry.section} className={cn(entry.items.length === 0 && 'text-muted-foreground')}>
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

export function NamespaceDeleteCard({
  municipalityId,
  namespaces,
  isProduction,
  onDeleted,
}: {
  municipalityId: number;
  namespaces: Namespace[];
  isProduction: boolean;
  onDeleted: () => void;
}) {
  const [namespace, setNamespace] = React.useState('');
  const [report, setReport] = React.useState<NamespaceDeleteReport | null>(null);
  const [busy, setBusy] = React.useState<'inspect' | 'delete' | null>(null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [typed, setTyped] = React.useState('');

  const canDelete = report?.outcome === 'ready' && report.namespace === namespace && busy === null;

  const run = async (mode: 'inspect' | 'delete') => {
    if (!namespace) return;
    setBusy(mode);
    try {
      const result = await deleteNamespace(municipalityId, namespace, mode === 'inspect');
      setReport(result);
      if (mode === 'delete') {
        if (result.outcome === 'completed') {
          toast.success(`Namespacet ${namespace} togs bort.`);
          onDeleted();
        } else if (result.outcome === 'partial_failure') {
          toast.error('Borttagningen avbröts. Se resultatet nedan.');
        } else {
          toast.error('Namespacet togs inte bort. Se resultatet nedan.');
        }
      }
    } catch (err) {
      toast.error(`${mode === 'inspect' ? 'Kontrollen' : 'Borttagningen'} misslyckades: ${errMsg(err)}`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="size-4 text-destructive" aria-hidden="true" />
          Ta bort namespace
        </CardTitle>
        <CardDescription>
          Tar bort namespacet med all metadata, etiketter, faser, e-postintegration, konfiguration och feature-flaggor. Vägras
          om namespacet har ärenden. Kan inte ångras.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-64 space-y-1.5">
            <Label htmlFor="delete-namespace">Namespace</Label>
            <Select
              value={namespace}
              onValueChange={(value) => {
                setNamespace(value);
                setReport(null);
              }}
            >
              <SelectTrigger id="delete-namespace">
                <SelectValue placeholder="Välj namespace" />
              </SelectTrigger>
              <SelectContent>
                {namespaces.map((ns) => (
                  <SelectItem key={ns.namespace} value={ns.namespace}>
                    {ns.displayName ? `${ns.displayName} (${ns.namespace})` : ns.namespace}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="button" variant="outline" disabled={!namespace || busy !== null} onClick={() => run('inspect')}>
            {busy === 'inspect' ?
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            : <Search className="size-4" aria-hidden="true" />}
            Visa vad som tas bort
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={!canDelete}
            onClick={() => {
              setTyped('');
              setConfirmOpen(true);
            }}
          >
            {busy === 'delete' ?
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            : <Trash2 className="size-4" aria-hidden="true" />}
            Ta bort
          </Button>
        </div>

        {report && <DeleteReportView report={report} />}
      </CardContent>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              {isProduction ? `Ta bort ${namespace} från produktion?` : `Ta bort ${namespace}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Allt i namespacet tas bort permanent. Skriv namespacets namn för att bekräfta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="delete-confirm">Namespace</Label>
            <Input
              id="delete-confirm"
              value={typed}
              autoComplete="off"
              placeholder={namespace}
              onChange={(event) => setTyped(event.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              disabled={typed.trim() !== namespace}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                setConfirmOpen(false);
                void run('delete');
              }}
            >
              Ta bort permanent
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
