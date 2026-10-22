import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { labelsForSave } from '@admin/label-editor';
import { type LabelNode } from '@admin/label-tree';
import { type LabelChange, LabelWorkspace } from '@admin/label-workspace';
import { AdminLayout } from '@admin/admin-layout';
import { useNamespaces } from '@admin/use-namespaces';
import { useResourceRows } from '@admin/use-resource-data';
import { saveLabels } from '@services/label-service';
import { errorMessage } from '@utils/error-message';
import { useIsProductionEnv } from '@utils/use-is-production-env.hook';
import { useLocalStorage } from '@utils/use-localstorage.hook';
import { Tags, TriangleAlert } from 'lucide-react';
import type { GetServerSideProps } from 'next';
import * as React from 'react';
import { toast } from 'sonner';

export const getServerSideProps: GetServerSideProps = async () => ({ props: {} });

const successMessage = (change: LabelChange) => {
  switch (change.kind) {
    case 'create':
      return 'Etiketten skapades.';
    case 'settings':
      return 'Etikettinställningarna sparades.';
    case 'deprecated':
      return change.deprecated ? 'Etiketten avvecklades.' : 'Etiketten återaktiverades.';
    case 'remove':
      return 'Etiketten togs bort permanent.';
  }
};

const failurePrefix: Record<LabelChange['kind'], string> = {
  create: 'Kunde inte skapa etikett',
  settings: 'Kunde inte spara etikettinställningar',
  deprecated: 'Kunde inte uppdatera etikett',
  remove: 'Kunde inte ta bort etikett',
};

export default function LabelsPage() {
  const [namespace, setNamespace] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const { isProduction, loaded: productionLoaded } = useIsProductionEnv();
  const municipalityId = useLocalStorage((s) => s.municipalityId);
  const namespaceOptions = useNamespaces();
  const { rows, loading, error, replaceRows } = useResourceRows('labels', namespace || undefined);
  const labelRows = rows as unknown as LabelNode[];
  const canDeleteLabels = productionLoaded && !isProduction;

  const saveLabelChange = async (nextLabels: LabelNode[], change: LabelChange) => {
    if (!namespace) return false;
    setSaving(true);
    try {
      const isFirstSave = change.kind === 'create' && labelRows.length === 0;
      const savedLabels = await saveLabels(municipalityId, namespace, labelsForSave(nextLabels), isFirstSave);
      replaceRows(savedLabels);
      toast.success(successMessage(change));
      return true;
    } catch (err) {
      toast.error(`${failurePrefix[change.kind]}: ${errorMessage(err)}`);
      return false;
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="Etiketter" breadcrumb="Resurser">
      <div className="flex flex-col gap-4">
        {error && !loading && (
          <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <TriangleAlert className="size-4 shrink-0" />
            {error === '401' ? 'Du är inte inloggad.' : `Kunde inte hämta data (fel ${error}).`}
          </div>
        )}

        <LabelWorkspace
          labels={labelRows}
          onLabelsChange={saveLabelChange}
          saving={saving}
          loading={loading}
          disabled={!namespace}
          canRemove={canDeleteLabels}
          resetKey={namespace}
          toolbar={
            <Select value={namespace} onValueChange={setNamespace} disabled={saving}>
              <SelectTrigger className="w-[16rem]" aria-label="Namespace">
                <SelectValue placeholder="Välj namespace" />
              </SelectTrigger>
              <SelectContent>
                {namespaceOptions.map((ns) => (
                  <SelectItem key={ns.value} value={ns.value}>
                    {ns.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
          placeholder={
            namespace ? undefined : (
              <div className="flex flex-col items-center gap-2 rounded-md border border-dashed py-12 text-center text-muted-foreground">
                <Tags className="size-6" />
                <p className="text-sm">Välj ett namespace för att visa etiketter.</p>
              </div>
            )
          }
        />
      </div>
    </AdminLayout>
  );
}
