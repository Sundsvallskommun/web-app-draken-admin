import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { LabelCreateDialog } from '@admin/label-create-dialog';
import { LabelColumns } from '@admin/label-columns';
import { LabelDeleteDialog } from '@admin/label-delete-dialog';
import { LabelDeprecatedDialog } from '@admin/label-deprecated-dialog';
import {
  canCreateLabelBelow,
  labelsForSave,
  removeLabel,
  ROOT_PARENT_VALUE,
  setLabelDeprecated,
} from '@admin/label-editor';
import { LabelTree, type LabelNode } from '@admin/label-tree';
import { AdminLayout } from '@admin/admin-layout';
import { useNamespaces } from '@admin/use-namespaces';
import { useResourceRows } from '@admin/use-resource-data';
import { saveLabels } from '@services/label-service';
import { cn } from '@utils/cn';
import { useIsProductionEnv } from '@utils/use-is-production-env.hook';
import { useLocalStorage } from '@utils/use-localstorage.hook';
import { Columns3, ListTree, Loader2, Plus, Search, Tags, TriangleAlert } from 'lucide-react';
import type { GetServerSideProps } from 'next';
import * as React from 'react';
import { toast } from 'sonner';

export const getServerSideProps: GetServerSideProps = async () => ({ props: {} });

type View = 'tree' | 'columns';

type SaveError = { response?: { data?: { message?: unknown } }; message?: unknown };
type DeprecatedTarget = { label: LabelNode; labelValue: string; deprecated: boolean };
type RemoveTarget = { label: LabelNode; labelValue: string };

const saveErrorMessage = (error: unknown) => {
  const err = error as SaveError;
  if (typeof err.response?.data?.message === 'string') return err.response.data.message;
  if (typeof err.message === 'string') return err.message;
  return 'fel';
};

export default function LabelsPage() {
  const [namespace, setNamespace] = React.useState('');
  const [query, setQuery] = React.useState('');
  const [view, setView] = React.useState<View>('columns');
  const [createOpen, setCreateOpen] = React.useState(false);
  const [createParentValue, setCreateParentValue] = React.useState(ROOT_PARENT_VALUE);
  const [deprecatedTarget, setDeprecatedTarget] = React.useState<DeprecatedTarget | null>(null);
  const [removeTarget, setRemoveTarget] = React.useState<RemoveTarget | null>(null);
  const [saving, setSaving] = React.useState(false);
  const { isProduction, loaded: productionLoaded } = useIsProductionEnv();
  const municipalityId = useLocalStorage((s) => s.municipalityId);
  const namespaceOptions = useNamespaces();
  const { rows, loading, error, refresh } = useResourceRows('labels', namespace || undefined);
  const labelRows = rows as unknown as LabelNode[];
  const canDeleteLabels = productionLoaded && !isProduction;

  const createLabel = async (nextLabels: LabelNode[]) => {
    if (!namespace) return;
    setSaving(true);
    try {
      await saveLabels(municipalityId, namespace, labelsForSave(nextLabels), labelRows.length === 0);
      toast.success('Etiketten skapades.');
      setCreateOpen(false);
      await refresh();
    } catch (err) {
      toast.error(`Kunde inte skapa etikett: ${saveErrorMessage(err)}`);
    } finally {
      setSaving(false);
    }
  };

  const openCreateDialog = (parentValue = ROOT_PARENT_VALUE) => {
    if (!canCreateLabelBelow(labelRows, parentValue)) {
      toast.error('Det går inte att lägga till etiketter under en deprecated etikett.');
      return;
    }
    setCreateParentValue(parentValue);
    setCreateOpen(true);
  };

  const saveDeprecatedState = async () => {
    if (!namespace || !deprecatedTarget) return;
    setSaving(true);
    try {
      const nextLabels = setLabelDeprecated(labelRows, deprecatedTarget.labelValue, deprecatedTarget.deprecated);
      await saveLabels(municipalityId, namespace, labelsForSave(nextLabels), false);
      toast.success(deprecatedTarget.deprecated ? 'Etiketten avvecklades.' : 'Etiketten återaktiverades.');
      setDeprecatedTarget(null);
      await refresh();
    } catch (err) {
      toast.error(`Kunde inte uppdatera etikett: ${saveErrorMessage(err)}`);
    } finally {
      setSaving(false);
    }
  };

  const removeSelectedLabel = async () => {
    if (!namespace || !removeTarget) return;
    if (!canDeleteLabels) {
      toast.error('Permanent borttagning är blockerad i produktion. Använd deprecated i stället.');
      return;
    }
    setSaving(true);
    try {
      const nextLabels = removeLabel(labelRows, removeTarget.labelValue);
      await saveLabels(municipalityId, namespace, labelsForSave(nextLabels), false);
      toast.success('Etiketten togs bort permanent.');
      setRemoveTarget(null);
      await refresh();
    } catch (err) {
      toast.error(`Kunde inte ta bort etikett: ${saveErrorMessage(err)}`);
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

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Sök bland etiketter…"
              className="pl-9"
              disabled={!namespace}
            />
          </div>
          <Select value={namespace} onValueChange={setNamespace}>
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

          {/* Visningsläge: macOS-liknande kolumnnavigering eller träd */}
          <div className="flex items-center rounded-md border p-0.5">
            <Button
              type="button"
              size="sm"
              variant={view === 'columns' ? 'secondary' : 'ghost'}
              className={cn('h-7 gap-1.5 px-2', view !== 'columns' && 'text-muted-foreground')}
              onClick={() => setView('columns')}
              aria-pressed={view === 'columns'}
            >
              <Columns3 className="size-4" />
              Kolumner
            </Button>
            <Button
              type="button"
              size="sm"
              variant={view === 'tree' ? 'secondary' : 'ghost'}
              className={cn('h-7 gap-1.5 px-2', view !== 'tree' && 'text-muted-foreground')}
              onClick={() => setView('tree')}
              aria-pressed={view === 'tree'}
            >
              <ListTree className="size-4" />
              Träd
            </Button>
          </div>

          {loading && <Loader2 className="size-4 animate-spin text-muted-foreground" />}

          <Button
            type="button"
            className="ml-auto gap-1.5"
            disabled={!namespace || loading}
            onClick={() => openCreateDialog()}
          >
            <Plus className="size-4" />
            Lägg till etikett
          </Button>
        </div>

        {!namespace ?
          <div className="flex flex-col items-center gap-2 rounded-md border border-dashed py-12 text-center text-muted-foreground">
            <Tags className="size-6" />
            <p className="text-sm">Välj ett namespace för att visa etiketter.</p>
          </div>
        : view === 'columns' ?
          <LabelColumns
            data={labelRows}
            query={query}
            resetKey={namespace}
            onAdd={openCreateDialog}
            onDeprecatedChange={(label, labelValue, deprecated) =>
              setDeprecatedTarget({ label, labelValue, deprecated })
            }
            onRemove={canDeleteLabels ? (label, labelValue) => setRemoveTarget({ label, labelValue }) : undefined}
          />
        : <LabelTree
            data={labelRows}
            query={query}
            onDeprecatedChange={(label, labelValue, deprecated) =>
              setDeprecatedTarget({ label, labelValue, deprecated })
            }
            onRemove={canDeleteLabels ? (label, labelValue) => setRemoveTarget({ label, labelValue }) : undefined}
          />
        }
      </div>

      <LabelCreateDialog
        data={labelRows}
        open={createOpen}
        saving={saving}
        initialParentValue={createParentValue}
        onOpenChange={setCreateOpen}
        onCreate={createLabel}
      />
      <LabelDeprecatedDialog
        target={deprecatedTarget}
        open={Boolean(deprecatedTarget)}
        saving={saving}
        onOpenChange={(open) => !open && setDeprecatedTarget(null)}
        onConfirm={saveDeprecatedState}
      />
      <LabelDeleteDialog
        label={removeTarget?.label ?? null}
        open={Boolean(removeTarget)}
        saving={saving}
        productionBlocked={!canDeleteLabels}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        onDelete={removeSelectedLabel}
      />
    </AdminLayout>
  );
}
