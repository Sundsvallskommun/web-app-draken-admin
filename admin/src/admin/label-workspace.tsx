import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { LabelColumns } from '@admin/label-columns';
import { LabelCreateDialog } from '@admin/label-create-dialog';
import { LabelDeleteDialog } from '@admin/label-delete-dialog';
import { LabelDeprecatedDialog } from '@admin/label-deprecated-dialog';
import { LabelSettingsDialog, type LabelSettingsTarget, type LabelSettingsValues } from '@admin/label-settings-dialog';
import {
  canCreateLabelBelow,
  removeLabel,
  ROOT_PARENT_VALUE,
  setLabelDeprecated,
  setLabelDisplayName,
  setLabelEscalationEmail,
} from '@admin/label-editor';
import { LabelTree, type LabelNode } from '@admin/label-tree';
import { cn } from '@utils/cn';
import { Columns3, ListTree, Loader2, Plus, Search } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

type View = 'tree' | 'columns';

type DeprecatedTarget = { label: LabelNode; labelValue: string; deprecated: boolean };
type RemoveTarget = { label: LabelNode; labelValue: string };

export type LabelChange =
  | { kind: 'create' }
  | { kind: 'settings' }
  | { kind: 'deprecated'; deprecated: boolean }
  | { kind: 'remove' };

export interface LabelWorkspaceProps {
  labels: LabelNode[];
  /**
   * Called with the whole next tree after each edit. Resolve `true` when the change was
   * applied (the dialog closes), `false` to keep the dialog open, e.g. after a failed save.
   */
  onLabelsChange: (nextLabels: LabelNode[], change: LabelChange) => Promise<boolean> | boolean;
  saving?: boolean;
  loading?: boolean;
  disabled?: boolean;
  canRemove: boolean;
  canDeprecate?: boolean;
  /** Resets the column drill-down when it changes, e.g. the namespace. */
  resetKey?: string;
  /** Extra toolbar controls rendered after the search field, e.g. a namespace select. */
  toolbar?: React.ReactNode;
  /** Rendered instead of the label views, e.g. "välj namespace". */
  placeholder?: React.ReactNode;
}

/** Search, column/tree views and the create/settings/deprecate/remove dialogs for a label tree. */
export function LabelWorkspace({
  labels,
  onLabelsChange,
  saving = false,
  loading = false,
  disabled = false,
  canRemove,
  canDeprecate = true,
  resetKey,
  toolbar,
  placeholder,
}: LabelWorkspaceProps) {
  const [query, setQuery] = React.useState('');
  const [view, setView] = React.useState<View>('columns');
  const [createOpen, setCreateOpen] = React.useState(false);
  const [createParentValue, setCreateParentValue] = React.useState(ROOT_PARENT_VALUE);
  const [deprecatedTarget, setDeprecatedTarget] = React.useState<DeprecatedTarget | null>(null);
  const [settingsTarget, setSettingsTarget] = React.useState<LabelSettingsTarget | null>(null);
  const [removeTarget, setRemoveTarget] = React.useState<RemoveTarget | null>(null);

  const createLabel = async (nextLabels: LabelNode[]) => {
    if (await onLabelsChange(nextLabels, { kind: 'create' })) setCreateOpen(false);
  };

  const openCreateDialog = (parentValue = ROOT_PARENT_VALUE) => {
    if (!canCreateLabelBelow(labels, parentValue)) {
      toast.error('Det går inte att lägga till etiketter under en deprecated etikett.');
      return;
    }
    setCreateParentValue(parentValue);
    setCreateOpen(true);
  };

  const saveDeprecatedState = async () => {
    if (!deprecatedTarget) return;
    const nextLabels = setLabelDeprecated(labels, deprecatedTarget.labelValue, deprecatedTarget.deprecated);
    if (await onLabelsChange(nextLabels, { kind: 'deprecated', deprecated: deprecatedTarget.deprecated })) {
      setDeprecatedTarget(null);
    }
  };

  const saveSettings = async ({ displayName, escalationEmail }: LabelSettingsValues) => {
    if (!settingsTarget) return;
    let nextLabels = setLabelDisplayName(labels, settingsTarget.labelValue, displayName);
    if (escalationEmail !== undefined) {
      nextLabels = setLabelEscalationEmail(nextLabels, settingsTarget.labelValue, escalationEmail);
    }
    if (await onLabelsChange(nextLabels, { kind: 'settings' })) setSettingsTarget(null);
  };

  const removeSelectedLabel = async () => {
    if (!removeTarget) return;
    if (!canRemove) {
      toast.error('Permanent borttagning är blockerad i produktion. Använd deprecated i stället.');
      return;
    }
    if (await onLabelsChange(removeLabel(labels, removeTarget.labelValue), { kind: 'remove' })) {
      setRemoveTarget(null);
    }
  };

  const openSettings = (label: LabelNode, labelValue: string) => setSettingsTarget({ label, labelValue });

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Sök bland etiketter…"
              className="pl-9"
              disabled={disabled}
            />
          </div>
          {toolbar}

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
            disabled={disabled || loading || saving}
            onClick={() => openCreateDialog()}
          >
            <Plus className="size-4" />
            Lägg till etikett
          </Button>
        </div>

        {placeholder ??
          (labels.length === 0 && !loading ?
            <p className="rounded-md border border-dashed py-8 text-center text-sm text-muted-foreground">
              Inga etiketter ännu.
            </p>
          : view === 'columns' ?
            <LabelColumns
              data={labels}
              query={query}
              resetKey={resetKey}
              onAdd={disabled ? undefined : openCreateDialog}
              onSearchResultSelect={() => setQuery('')}
              onSettings={disabled ? undefined : openSettings}
            />
          : <LabelTree data={labels} query={query} onSettings={disabled ? undefined : openSettings} />)}
      </div>

      <LabelCreateDialog
        data={labels}
        open={createOpen}
        saving={saving}
        initialParentValue={createParentValue}
        onOpenChange={setCreateOpen}
        onCreate={createLabel}
      />
      <LabelSettingsDialog
        target={settingsTarget}
        open={Boolean(settingsTarget)}
        saving={saving}
        canRemove={canRemove}
        canDeprecate={canDeprecate}
        onOpenChange={(open) => !open && setSettingsTarget(null)}
        onSave={saveSettings}
        onDeprecatedChange={(deprecated) => {
          if (!settingsTarget) return;
          setDeprecatedTarget({ ...settingsTarget, deprecated });
          setSettingsTarget(null);
        }}
        onRemove={() => {
          if (!settingsTarget) return;
          setRemoveTarget(settingsTarget);
          setSettingsTarget(null);
        }}
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
        productionBlocked={!canRemove}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        onDelete={removeSelectedLabel}
      />
    </>
  );
}
