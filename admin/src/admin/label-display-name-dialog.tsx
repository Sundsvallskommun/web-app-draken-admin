import { Button } from '@components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@components/ui/dialog';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import type { LabelNode } from '@interfaces/label';
import { Loader2 } from 'lucide-react';
import * as React from 'react';

export interface LabelDisplayNameTarget {
  label: LabelNode;
  labelValue: string;
}

const labelName = (label: LabelNode) => label.displayName || label.resourceName || label.classification;

export function LabelDisplayNameDialog({
  target,
  open,
  saving,
  onOpenChange,
  onSave,
}: {
  target: LabelDisplayNameTarget | null;
  open: boolean;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (displayName: string) => Promise<void>;
}) {
  const [displayName, setDisplayName] = React.useState('');
  const [error, setError] = React.useState('');
  const currentDisplayName = target?.label.displayName ?? '';
  const trimmedDisplayName = displayName.trim();
  const unchanged = trimmedDisplayName === currentDisplayName.trim();

  React.useEffect(() => {
    if (!open) return;
    setDisplayName(currentDisplayName);
    setError('');
  }, [currentDisplayName, open]);

  const save = async () => {
    if (!trimmedDisplayName) {
      setError('Visningsnamn är obligatoriskt.');
      return;
    }
    setError('');
    await onSave(trimmedDisplayName);
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !saving && onOpenChange(nextOpen)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Redigera visningsnamn</DialogTitle>
          <DialogDescription>
            Ändra namnet som visas för <strong>{target ? labelName(target.label) : ''}</strong>. Resursnamnet
            {target ? ` ${target.label.resourceName}` : ''} ändras inte.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="label-display-name-edit">Visningsnamn</Label>
            <Input
              id="label-display-name-edit"
              value={displayName}
              onChange={(event) => {
                setDisplayName(event.target.value);
                setError('');
              }}
              disabled={saving}
              required
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Avbryt
            </Button>
            <Button type="submit" disabled={!target || saving || unchanged}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              Spara
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
