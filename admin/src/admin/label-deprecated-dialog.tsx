import { Button } from '@components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@components/ui/dialog';
import type { LabelNode } from '@interfaces/label';
import { Loader2 } from 'lucide-react';

const labelName = (label: LabelNode) => label.displayName || label.resourceName || label.classification;

const descendantCount = (label: LabelNode): number =>
  (label.labels ?? []).reduce((count, child) => count + 1 + descendantCount(child), 0);

export function LabelDeprecatedDialog({
  target,
  open,
  saving,
  onOpenChange,
  onConfirm,
}: {
  target: { label: LabelNode; labelValue: string; deprecated: boolean } | null;
  open: boolean;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
}) {
  const childCount = target ? descendantCount(target.label) : 0;
  const action = target?.deprecated ? 'Avveckla' : 'Återaktivera';

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !saving && onOpenChange(nextOpen)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {action} {target ? labelName(target.label) : 'etikett'}?
          </DialogTitle>
          <DialogDescription>
            {target?.deprecated ?
              childCount > 0 ?
                `Vald etikett och ${childCount} underliggande ${childCount === 1 ? 'etikett' : 'etiketter'} markeras som deprecated.`
              : 'Vald etikett markeras som deprecated.'
            : childCount > 0 ?
              `Vald etikett och ${childCount} underliggande ${childCount === 1 ? 'etikett' : 'etiketter'} återaktiveras.`
            : 'Vald etikett återaktiveras.'}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Avbryt
          </Button>
          <Button type="button" onClick={() => void onConfirm()} disabled={!target || saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            {action}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
