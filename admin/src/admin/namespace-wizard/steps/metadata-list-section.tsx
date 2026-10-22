import { EditableMetadataList } from '@admin/editable-metadata-list';
import { getResourceConfig } from '@admin/resource-config';
import { useNamespaceWizard } from '../namespace-wizard-context';
import {
  emptyMetadataRow,
  METADATA_ITEM_LABELS,
  metadataFields,
  metadataKeyField,
  requiredMetadataKeys,
} from '../namespace-wizard-fields';
import { validateMetadataRows } from '../namespace-wizard-validation';
import type { MetadataResourceName, NamespaceWizardDraft } from '../namespace-wizard-types';

/** One of the wizard's metadata lists (statuses, roles or contact reasons), edited in the draft. */
export function MetadataListSection({
  resourceName,
  requireAtLeastOne,
  showErrors,
}: {
  resourceName: MetadataResourceName;
  requireAtLeastOne?: boolean;
  showErrors: boolean;
}) {
  const { state, updateDraft, locks, submission } = useNamespaceWizard();
  const rows = state.draft[resourceName];
  const validation = validateMetadataRows(resourceName, rows, { requireAtLeastOne });
  const { singular, plural } = METADATA_ITEM_LABELS[resourceName];
  const headingId = `wizard-${resourceName}-heading`;

  return (
    <section className="space-y-3" aria-labelledby={headingId}>
      <div>
        <h3 id={headingId} className="text-sm font-medium">
          {plural}
        </h3>
        <p className="text-sm text-muted-foreground">{getResourceConfig(resourceName)?.description}</p>
      </div>
      <EditableMetadataList
        fields={metadataFields(resourceName)}
        rows={rows}
        onChange={(nextRows) => updateDraft({ [resourceName]: nextRows } as Partial<NamespaceWizardDraft>)}
        keyField={metadataKeyField(resourceName)}
        emptyRow={() => emptyMetadataRow(resourceName)}
        requiredKeys={requiredMetadataKeys(resourceName)}
        lockedKeys={locks.metadataKeys[resourceName]}
        rowErrors={showErrors ? validation.rows : undefined}
        itemLabel={singular.toLowerCase()}
        addLabel={`Lägg till ${singular.toLowerCase()}`}
        emptyText={`Inga ${plural.toLowerCase()} ännu.`}
        disabled={submission.running}
      />
      {showErrors && validation.list && <p className="text-sm text-destructive">{validation.list}</p>}
    </section>
  );
}
