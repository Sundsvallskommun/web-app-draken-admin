import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { LabelCreateDialog } from '@admin/label-create-dialog';
import { LabelColumns } from '@admin/label-columns';
import { labelListFromApiResponse, logLabelMoveValidation, syncLabelDebugFlagFromUrl } from '@admin/label-debug';
import { LabelDeleteDialog } from '@admin/label-delete-dialog';
import { LabelMovePreviewDialog } from '@admin/label-move-preview-dialog';
import {
  buildLabelMovePreview,
  defaultClassificationForDepth,
  labelsForSave,
  removeLabel,
  ROOT_PARENT_VALUE,
  type LabelMoveError,
  type LabelMovePreview,
} from '@admin/label-editor';
import { LabelTree, type LabelNode } from '@admin/label-tree';
import { AdminLayout } from '@admin/admin-layout';
import { useNamespaces } from '@admin/use-namespaces';
import { useResourceRows } from '@admin/use-resource-data';
import { saveLabels } from '@services/label-service';
import { cn } from '@utils/cn';
import { useLocalStorage } from '@utils/use-localstorage.hook';
import { Columns3, ListTree, Loader2, Plus, Search, Tags, TriangleAlert } from 'lucide-react';
import type { GetServerSideProps } from 'next';
import * as React from 'react';
import { toast } from 'sonner';

export const getServerSideProps: GetServerSideProps = async () => ({ props: {} });

type View = 'tree' | 'columns';

type SaveError = { response?: { data?: { message?: unknown } }; message?: unknown };
type RemoveTarget = { label: LabelNode; labelValue: string };

const saveErrorMessage = (error: unknown) => {
  const err = error as SaveError;
  if (typeof err.response?.data?.message === 'string') return err.response.data.message;
  if (typeof err.message === 'string') return err.message;
  return 'fel';
};

const labelDisplayName = (label: LabelNode) => label.displayName || label.resourceName || label.classification;

const moveErrorMessage = (reason: LabelMoveError, label: LabelNode) => {
  if (reason === 'root-target-unsupported') {
    return `"${labelDisplayName(label)}" kan inte flyttas till rotnivå utan att riskera nytt id.`;
  }
  if (reason === 'deeper-level') {
    return 'Etiketter kan inte flyttas till en djupare nivå.';
  }
  if (reason === 'same-parent') {
    return 'Etiketten ligger redan under den valda nivån.';
  }
  if (reason === 'missing-target') {
    return 'Målet finns inte längre. Uppdatera vyn och försök igen.';
  }
  if (reason === 'missing-classification') {
    return 'Flytten saknar klassificering.';
  }
  return 'Etiketten finns inte längre. Uppdatera vyn och försök igen.';
};

export default function LabelsPage() {
  const [namespace, setNamespace] = React.useState('');
  const [query, setQuery] = React.useState('');
  const [view, setView] = React.useState<View>('columns');
  const [createOpen, setCreateOpen] = React.useState(false);
  const [createParentValue, setCreateParentValue] = React.useState(ROOT_PARENT_VALUE);
  const [removeTarget, setRemoveTarget] = React.useState<RemoveTarget | null>(null);
  const [movePreview, setMovePreview] = React.useState<LabelMovePreview | null>(null);
  const [saving, setSaving] = React.useState(false);
  const municipalityId = useLocalStorage((s) => s.municipalityId);
  const namespaceOptions = useNamespaces();
  const { rows, loading, error, refresh } = useResourceRows('labels', namespace || undefined);
  const labelRows = rows as unknown as LabelNode[];

  React.useEffect(() => {
    syncLabelDebugFlagFromUrl();
  }, []);

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
    setCreateParentValue(parentValue);
    setCreateOpen(true);
  };

  const removeSelectedLabel = async () => {
    if (!namespace || !removeTarget) return;
    setSaving(true);
    try {
      const nextLabels = removeLabel(labelRows, removeTarget.labelValue);
      await saveLabels(municipalityId, namespace, labelsForSave(nextLabels), false);
      toast.success('Etiketten togs bort.');
      setRemoveTarget(null);
      await refresh();
    } catch (err) {
      toast.error(`Kunde inte ta bort etikett: ${saveErrorMessage(err)}`);
    } finally {
      setSaving(false);
    }
  };

  const confirmMovedLabel = async () => {
    if (!namespace || !movePreview) return;
    const preview = movePreview;
    const putPayload = labelsForSave(preview.after);
    setSaving(true);
    try {
      const putResponse = await saveLabels(municipalityId, namespace, putPayload, false);
      toast.success('Etiketten flyttades.');
      setMovePreview(null);
      const getResponse = await refresh();
      logLabelMoveValidation({
        namespace,
        municipalityId,
        preview,
        putPayload,
        putResponse: labelListFromApiResponse(putResponse.data),
        getResponse: labelListFromApiResponse(getResponse),
      });
    } catch (err) {
      toast.error(`Kunde inte flytta etikett: ${saveErrorMessage(err)}`);
    } finally {
      setSaving(false);
    }
  };

  const previewMovedLabel = (label: LabelNode, sourceValue: string, targetParentValue: string, targetLevel: number) => {
    const preview = buildLabelMovePreview(labelRows, {
      sourceValue,
      targetParentValue,
      classification: defaultClassificationForDepth(targetLevel),
    });

    if (!preview.ok) {
      toast.error(moveErrorMessage(preview.reason, label));
      return;
    }

    setMovePreview(preview.preview);
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
            onRemove={(label, labelValue) => setRemoveTarget({ label, labelValue })}
            onMove={(label, sourceValue, targetParentValue, targetLevel) =>
              previewMovedLabel(label, sourceValue, targetParentValue, targetLevel)
            }
          />
        : <LabelTree
            data={labelRows}
            query={query}
            onRemove={(label, labelValue) => setRemoveTarget({ label, labelValue })}
            onMove={(label, sourceValue, targetParentValue, targetLevel) =>
              previewMovedLabel(label, sourceValue, targetParentValue, targetLevel)
            }
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
      <LabelDeleteDialog
        label={removeTarget?.label ?? null}
        open={Boolean(removeTarget)}
        saving={saving}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        onDelete={removeSelectedLabel}
      />
      <LabelMovePreviewDialog
        preview={movePreview}
        open={Boolean(movePreview)}
        saving={saving}
        onOpenChange={(open) => !open && setMovePreview(null)}
        onConfirm={confirmMovedLabel}
      />
    </AdminLayout>
  );
}
