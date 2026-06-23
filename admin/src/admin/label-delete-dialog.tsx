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
import { Input } from '@components/ui/input';
import type { LabelNode } from '@interfaces/label';
import { Loader2 } from 'lucide-react';
import * as React from 'react';

const labelName = (label: LabelNode) => label.displayName || label.resourceName || label.classification;

const descendantCount = (label: LabelNode): number =>
  (label.labels ?? []).reduce((count, child) => count + 1 + descendantCount(child), 0);

export function LabelDeleteDialog({
  label,
  open,
  saving,
  productionBlocked,
  onOpenChange,
  onDelete,
}: {
  label: LabelNode | null;
  open: boolean;
  saving: boolean;
  productionBlocked: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => Promise<void>;
}) {
  const [confirmation, setConfirmation] = React.useState('');
  const childCount = label ? descendantCount(label) : 0;
  const canDelete = Boolean(label) && !saving && !productionBlocked && confirmation === 'DELETE';

  React.useEffect(() => {
    if (open) setConfirmation('');
  }, [open]);

  return (
    <AlertDialog open={open} onOpenChange={(nextOpen) => !saving && onOpenChange(nextOpen)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Ta bort {label ? labelName(label) : 'etikett'} permanent?</AlertDialogTitle>
          <AlertDialogDescription>
            {productionBlocked ?
              'Permanent borttagning är blockerad i produktion. Använd deprecated i stället.'
            : childCount > 0 ?
              `Detta tar också bort ${childCount} underliggande ${childCount === 1 ? 'etikett' : 'etiketter'}. Skriv DELETE för att bekräfta.`
            : 'Skriv DELETE för att bekräfta permanent borttagning.'}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {!productionBlocked && (
          <Input
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            placeholder="Skriv DELETE"
            disabled={saving}
          />
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={saving}>Avbryt</AlertDialogCancel>
          <Button type="button" variant="destructive" onClick={onDelete} disabled={!canDelete}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            Ta bort permanent
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
