import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@components/ui/alert-dialog';
import { flattenLabelSubtree } from '@admin/label-editor';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import type { LabelNode } from '@interfaces/label';
import { FolderOpen, Loader2, Tag } from 'lucide-react';

const labelName = (label: LabelNode) => label.displayName || label.resourceName || label.classification;

export function LabelDeleteDialog({
  label,
  open,
  saving,
  onOpenChange,
  onDelete,
}: {
  label: LabelNode | null;
  open: boolean;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => Promise<void>;
}) {
  const removedLabels = label ? flattenLabelSubtree(label) : [];
  const childCount = Math.max(removedLabels.length - 1, 0);

  return (
    <AlertDialog open={open} onOpenChange={(nextOpen) => !saving && onOpenChange(nextOpen)}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Ta bort {label ? labelName(label) : 'etikett'}?</AlertDialogTitle>
          <AlertDialogDescription>
            {childCount > 0 ?
              `Detta tar också bort ${childCount} underliggande ${childCount === 1 ? 'etikett' : 'etiketter'}.`
            : 'Detta tar bort den valda etiketten.'}{' '}
            Detta går inte att ångra.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {removedLabels.length > 0 && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
            <div className="mb-2 text-xs font-medium uppercase tracking-normal text-destructive">Tas bort</div>
            <ul className="max-h-[18rem] space-y-1 overflow-auto pr-1">
              {removedLabels.map(({ node, depth, key }, index) => {
                const children = node.labels ?? [];
                return (
                  <li
                    key={`${key}-${depth}-${index}`}
                    className="flex min-w-0 items-center gap-2 rounded-md border border-destructive/20 bg-background/80 px-2 py-1.5 text-sm"
                    style={{ marginLeft: `${depth}rem` }}
                  >
                    {children.length > 0 ?
                      <FolderOpen className="size-4 shrink-0 text-muted-foreground" />
                    : <Tag className="size-4 shrink-0 text-muted-foreground" />}
                    <span className="min-w-0 flex-1 truncate">{labelName(node)}</span>
                    <Badge variant="secondary" className="h-5 shrink-0 px-1.5 text-xs">
                      {node.classification}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={saving}>Avbryt</AlertDialogCancel>
          <Button type="button" variant="destructive" onClick={onDelete} disabled={saving || !label}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            Ta bort
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
