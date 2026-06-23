import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@components/ui/alert-dialog';
import { Button } from '@components/ui/button';
import type { LabelNode } from '@interfaces/label';
import { Loader2 } from 'lucide-react';

const labelName = (label: LabelNode) => label.displayName || label.resourceName || label.classification;

const descendantCount = (label: LabelNode): number =>
  (label.labels ?? []).reduce((count, child) => count + 1 + descendantCount(child), 0);

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
  const children = label ? descendantCount(label) : 0;

  return (
    <AlertDialog open={open} onOpenChange={(nextOpen) => !saving && onOpenChange(nextOpen)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Ta bort {label ? labelName(label) : 'etikett'}?</AlertDialogTitle>
          <AlertDialogDescription>
            {children > 0 ?
              `Detta tar också bort ${children} underliggande ${children === 1 ? 'etikett' : 'etiketter'}.`
            : 'Detta går inte att ångra.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
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
