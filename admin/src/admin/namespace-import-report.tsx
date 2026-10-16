import { Badge } from '@components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import type {
  ImportIssueResponse,
  ImportPlanEntryResponse,
  ImportStepResult,
  NamespaceImportReport,
} from '@data-contracts/backend/data-contracts';
import { cn } from '@utils/cn';
import { CheckCircle2, CircleAlert, Info, TriangleAlert } from 'lucide-react';
import * as React from 'react';

type Section = ImportPlanEntryResponse['section'];

const SECTION_LABELS: Record<Section, string> = {
  namespaceConfig: 'Namespace-konfiguration',
  statuses: 'Statusar',
  roles: 'Roller',
  categories: 'Kategorier',
  contactReasons: 'Kontaktorsaker',
  attachmentPurposes: 'Bilagesyften',
  measureTypes: 'Åtgärdstyper',
  decisionOutcomes: 'Beslutsutfall',
  statementOutcomes: 'Yttrandeutfall',
  labels: 'Etiketter',
  emailIntegration: 'E-postintegration',
  featureFlags: 'Feature-flaggor',
};

const STEP_STATUS: Record<ImportStepResult['status'], { label: string; className: string }> = {
  done: { label: 'Klar', className: 'border-emerald-700 bg-emerald-600 text-white' },
  skipped: { label: 'Hoppades över', className: 'bg-secondary text-secondary-foreground' },
  failed: { label: 'Misslyckades', className: 'bg-destructive text-destructive-foreground' },
  not_run: { label: 'Ej körd', className: 'border bg-background text-muted-foreground' },
};

const OUTCOME: Record<NamespaceImportReport['outcome'], { title: string; description: string; tone: 'ok' | 'warn' | 'error' }> = {
  valid: { title: 'Dokumentet är giltigt', description: 'Inget har skrivits ännu. Granska planen och importera.', tone: 'ok' },
  invalid: { title: 'Dokumentet har fel', description: 'Åtgärda felen nedan och validera igen.', tone: 'error' },
  conflict: {
    title: 'Namespacet finns redan',
    description: 'Slå på "Tillåt befintligt namespace" för att bara skapa det som saknas, eller byt namn.',
    tone: 'error',
  },
  completed: { title: 'Importen är klar', description: 'Alla sektioner skapades eller hoppades över.', tone: 'ok' },
  partial_failure: {
    title: 'Importen avbröts',
    description:
      'Ett steg misslyckades. Det som redan skapats finns kvar. Åtgärda felet och kör igen med "Tillåt befintligt namespace" för att fortsätta där importen stannade.',
    tone: 'error',
  },
};

export function OutcomeBanner({ report }: { report: NamespaceImportReport }) {
  const outcome = OUTCOME[report.outcome];
  const warnings = report.issues.filter((issue) => issue.severity === 'warning').length;
  const Icon = outcome.tone === 'ok' ? CheckCircle2 : outcome.tone === 'warn' ? TriangleAlert : CircleAlert;
  return (
    <div
      role="status"
      className={cn(
        'flex items-start gap-3 rounded-md border p-3 text-sm',
        outcome.tone === 'ok' && 'border-emerald-700/40 bg-emerald-50 dark:bg-emerald-950/30',
        outcome.tone === 'error' && 'border-destructive/40 bg-destructive/10'
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div>
        <p className="font-medium">{outcome.title}</p>
        <p className="text-muted-foreground">{outcome.description}</p>
        {warnings > 0 && (
          <p className="text-muted-foreground">
            {warnings === 1 ? '1 varning' : `${warnings} varningar`} som inte stoppar importen.
          </p>
        )}
      </div>
    </div>
  );
}

export function IssuesTable({ issues }: { issues: ImportIssueResponse[] }) {
  if (issues.length === 0) return null;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-28">Typ</TableHead>
          <TableHead className="w-80">Sökväg</TableHead>
          <TableHead>Meddelande</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {issues.map((issue, index) => (
          <TableRow key={`${issue.path}-${index}`}>
            <TableCell>
              {issue.severity === 'error' ?
                <Badge variant="destructive">Fel</Badge>
              : <Badge variant="secondary">Varning</Badge>}
            </TableCell>
            <TableCell className="font-mono text-xs">{issue.path || '(dokumentet)'}</TableCell>
            <TableCell>{issue.message}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function PlanTable({ plan }: { plan: ImportPlanEntryResponse[] }) {
  if (plan.length === 0) return null;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Sektion</TableHead>
          <TableHead className="w-24 text-right">Skapas</TableHead>
          <TableHead className="w-28 text-right">Hoppas över</TableHead>
          <TableHead>Befintliga som lämnas orörda</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {plan.map((entry) => (
          <TableRow key={entry.section} className={cn(entry.create === 0 && entry.skip === 0 && 'text-muted-foreground')}>
            <TableCell>{SECTION_LABELS[entry.section]}</TableCell>
            <TableCell className="text-right">{entry.create}</TableCell>
            <TableCell className="text-right">{entry.skip}</TableCell>
            <TableCell className="font-mono text-xs">{entry.skipped.join(', ')}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function StepsTable({ steps }: { steps: ImportStepResult[] }) {
  if (steps.length === 0) return null;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Sektion</TableHead>
          <TableHead className="w-32">Status</TableHead>
          <TableHead className="w-24 text-right">Skapade</TableHead>
          <TableHead className="w-28 text-right">Hoppade över</TableHead>
          <TableHead>Detaljer</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {steps.map((step) => {
          const status = STEP_STATUS[step.status];
          return (
            <TableRow key={step.section}>
              <TableCell>{SECTION_LABELS[step.section]}</TableCell>
              <TableCell>
                <Badge className={status.className}>{status.label}</Badge>
              </TableCell>
              <TableCell className="text-right">{step.created.length}</TableCell>
              <TableCell className="text-right">{step.skipped.length}</TableCell>
              <TableCell className="text-xs">
                {step.error ?
                  <span className="text-destructive">{step.error}</span>
                : <span className="font-mono text-muted-foreground">{step.created.join(', ')}</span>}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export function NamespaceImportReportView({ report }: { report: NamespaceImportReport }) {
  const executed = report.steps.length > 0;
  return (
    <div className="space-y-4">
      <OutcomeBanner report={report} />
      {report.issues.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-sm font-medium">Valideringsresultat</h3>
          <div className="rounded-md border">
            <IssuesTable issues={report.issues} />
          </div>
        </section>
      )}
      {executed ?
        <section className="space-y-2">
          <h3 className="text-sm font-medium">Utfört</h3>
          <div className="rounded-md border">
            <StepsTable steps={report.steps} />
          </div>
        </section>
      : report.plan.length > 0 && (
          <section className="space-y-2">
            <h3 className="flex items-center gap-2 text-sm font-medium">
              Plan
              <span className="flex items-center gap-1 text-xs font-normal text-muted-foreground">
                <Info className="size-3.5" aria-hidden="true" />
                Befintliga poster jämförs bara på namn och ändras aldrig.
              </span>
            </h3>
            <div className="rounded-md border">
              <PlanTable plan={report.plan} />
            </div>
          </section>
        )
      }
    </div>
  );
}
