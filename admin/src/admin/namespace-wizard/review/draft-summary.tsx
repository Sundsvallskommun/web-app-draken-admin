import { LabelTree } from '@admin/label-tree';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { municipalityName } from '@utils/municipalities';
import { Pencil } from 'lucide-react';
import type * as React from 'react';
import { useNamespaceWizard } from '../namespace-wizard-context';
import { METADATA_ITEM_LABELS, metadataKeyField } from '../namespace-wizard-fields';
import type { MetadataResourceName, WizardStepId } from '../namespace-wizard-types';

function SummaryCard({ title, stepId, children }: { title: string; stepId: WizardStepId; children: React.ReactNode }) {
  const { goToStep, submission } = useNamespaceWizard();
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        <Button type="button" variant="ghost" size="sm" onClick={() => goToStep(stepId)} disabled={submission.running}>
          <Pencil className="size-4" />
          Ändra
        </Button>
      </CardHeader>
      <CardContent className="text-sm">{children}</CardContent>
    </Card>
  );
}

function SummaryList({ items }: { items: [string, React.ReactNode][] }) {
  return (
    <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-1">
      {items.map(([term, description]) => (
        <div key={term} className="contents">
          <dt className="text-muted-foreground">{term}</dt>
          <dd>{description || '–'}</dd>
        </div>
      ))}
    </dl>
  );
}

function MetadataBadges({ resourceName }: { resourceName: MetadataResourceName }) {
  const { state } = useNamespaceWizard();
  const keyField = metadataKeyField(resourceName);
  const rows = state.draft[resourceName].filter((row) => row[keyField]?.trim());
  const { plural } = METADATA_ITEM_LABELS[resourceName];
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{plural}</p>
      {rows.length === 0 ?
        <p className="text-muted-foreground">Inga {plural.toLowerCase()}.</p>
      : <div className="flex flex-wrap gap-1.5">
          {rows.map((row) => (
            <Badge key={row[keyField]} variant="secondary" title={row.displayName || undefined}>
              {row[keyField]}
            </Badge>
          ))}
        </div>
      }
    </div>
  );
}

const yesNo = (value: unknown) => (value === true ? 'Ja' : 'Nej');

/** Read-only overview of the draft, one card per step. */
export function DraftSummary() {
  const { state } = useNamespaceWizard();
  const { namespaceConfig, emailIntegration, labels, templateNamespace, municipalityId } = state.draft;
  const emailValues = emailIntegration.values;

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <SummaryCard title="Namespace" stepId="namespace">
        <SummaryList
          items={[
            ['Namespace', String(namespaceConfig.namespace ?? '')],
            ['Visningsnamn', String(namespaceConfig.displayName ?? '')],
            ['Kortkod', String(namespaceConfig.shortCode ?? '')],
            ['Notis-TTL (dagar)', String(namespaceConfig.notificationTTLInDays ?? '')],
            ['Åtkomstkontroll', yesNo(namespaceConfig.accessControl)],
            ['Notifiera anmälare', yesNo(namespaceConfig.notifyReporter)],
            ['Kommun', municipalityName(municipalityId)],
            ['Utgår från', templateNamespace ?? ''],
          ]}
        />
      </SummaryCard>

      <SummaryCard title="Statusar och roller" stepId="statusesAndRoles">
        <div className="space-y-3">
          <MetadataBadges resourceName="statuses" />
          <MetadataBadges resourceName="roles" />
        </div>
      </SummaryCard>

      <SummaryCard title="Kontaktorsaker och etiketter" stepId="contactReasonsAndLabels">
        <div className="space-y-3">
          <MetadataBadges resourceName="contactReasons" />
          {labels.length > 0 ?
            <LabelTree data={labels} />
          : <p className="text-muted-foreground">Inga etiketter.</p>}
        </div>
      </SummaryCard>

      <SummaryCard title="E-postintegration" stepId="emailIntegration">
        {emailIntegration.configure ?
          <SummaryList
            items={[
              ['Aktiverad', yesNo(emailValues.enabled)],
              ['Status för nya ärenden', String(emailValues.statusForNew ?? '')],
              ['Avsändare nytt ärende', String(emailValues.errandNewEmailSender ?? '')],
              ['Avsändare avslutat ärende', String(emailValues.errandClosedEmailSender ?? '')],
              ['Intressentroll', String(emailValues.stakeholderRole ?? '')],
            ]}
          />
        : <p className="text-muted-foreground">Skapas inte.</p>}
      </SummaryCard>
    </div>
  );
}
