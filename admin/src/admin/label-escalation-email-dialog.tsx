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
import { isValidEmail } from '@utils/email';
import { getEscalationEmail } from '@utils/label-attributes';
import { Loader2 } from 'lucide-react';
import * as React from 'react';

export interface LabelEscalationEmailTarget {
  label: LabelNode;
  labelValue: string;
}

const labelName = (label: LabelNode) => label.displayName || label.resourceName || label.classification;

export function LabelEscalationEmailDialog({
  target,
  open,
  saving,
  onOpenChange,
  onSave,
}: {
  target: LabelEscalationEmailTarget | null;
  open: boolean;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (email: string) => Promise<void>;
}) {
  const [email, setEmail] = React.useState('');
  const [error, setError] = React.useState('');
  const currentEmail = target ? getEscalationEmail(target.label) : '';

  React.useEffect(() => {
    if (!open) return;
    setEmail(currentEmail);
    setError('');
  }, [currentEmail, open]);

  const save = async (value: string) => {
    const trimmedEmail = value.trim();
    if (trimmedEmail && !isValidEmail(trimmedEmail)) {
      setError('Ange en giltig e-postadress, till exempel namn@domän.se.');
      return;
    }
    setError('');
    await onSave(trimmedEmail);
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !saving && onOpenChange(nextOpen)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eskaleringsadress</DialogTitle>
          <DialogDescription>
            Adressen förifylls som mottagare när ett ärende med typen{' '}
            <strong>{target ? labelName(target.label) : ''}</strong> överlämnas via e-post.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void save(email);
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="label-escalation-email">E-postadress</Label>
            <Input
              id="label-escalation-email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setError('');
              }}
              placeholder="namn@domän.se"
              autoComplete="email"
              disabled={saving}
            />
            <p className="text-xs text-muted-foreground">Lämna fältet tomt och spara för att ta bort adressen.</p>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            {currentEmail && (
              <Button
                type="button"
                variant="destructive"
                className="sm:mr-auto"
                onClick={() => void save('')}
                disabled={saving}
              >
                Ta bort adress
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Avbryt
            </Button>
            <Button type="submit" disabled={!target || saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              Spara
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
