import { LabelCopyValue } from '@admin/label-copy-value';
import { Badge } from '@components/ui/badge';
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
import { getEscalationEmail, isEscalationEmailApplicable } from '@utils/label-attributes';
import { Ban, Loader2, RotateCcw, Trash2 } from 'lucide-react';
import * as React from 'react';

export interface LabelSettingsTarget {
  label: LabelNode;
  labelValue: string;
}

export interface LabelSettingsValues {
  displayName: string;
  escalationEmail?: string;
}

const labelName = (label: LabelNode) => label.displayName || label.resourceName || label.classification;

export function LabelSettingsDialog({
  target,
  open,
  saving,
  canRemove,
  onOpenChange,
  onSave,
  onDeprecatedChange,
  onRemove,
}: {
  target: LabelSettingsTarget | null;
  open: boolean;
  saving: boolean;
  canRemove: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (values: LabelSettingsValues) => Promise<void>;
  onDeprecatedChange: (deprecated: boolean) => void;
  onRemove: () => void;
}) {
  const [displayName, setDisplayName] = React.useState('');
  const [escalationEmail, setEscalationEmail] = React.useState('');
  const [error, setError] = React.useState('');

  const currentDisplayName = target?.label.displayName ?? '';
  const currentEscalationEmail = target ? getEscalationEmail(target.label) : '';
  const showEscalationEmail = Boolean(
    target && (isEscalationEmailApplicable(target.label.classification) || currentEscalationEmail)
  );
  const isDeprecated = target?.label.deprecated === true;
  const trimmedDisplayName = displayName.trim();
  const trimmedEscalationEmail = escalationEmail.trim();
  const unchanged =
    trimmedDisplayName === currentDisplayName.trim() &&
    (!showEscalationEmail || trimmedEscalationEmail === currentEscalationEmail.trim());

  React.useEffect(() => {
    if (!open) return;
    setDisplayName(currentDisplayName);
    setEscalationEmail(currentEscalationEmail);
    setError('');
  }, [currentDisplayName, currentEscalationEmail, open]);

  const save = async () => {
    if (!trimmedDisplayName) {
      setError('Visningsnamn är obligatoriskt.');
      return;
    }
    if (showEscalationEmail && trimmedEscalationEmail && !isValidEmail(trimmedEscalationEmail)) {
      setError('Ange en giltig e-postadress, till exempel namn@domän.se.');
      return;
    }

    setError('');
    await onSave({
      displayName: trimmedDisplayName,
      ...(showEscalationEmail ? { escalationEmail: trimmedEscalationEmail } : {}),
    });
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !saving && onOpenChange(nextOpen)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Inställningar för {target ? labelName(target.label) : 'etikett'}</DialogTitle>
          <DialogDescription>Redigera visning, tekniska uppgifter och etikettens status.</DialogDescription>
        </DialogHeader>

        <form
          className="space-y-5"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          <section className="space-y-4" aria-labelledby="label-settings-general">
            <h3 id="label-settings-general" className="text-sm font-medium">
              Allmänt
            </h3>
            <div className="space-y-2">
              <Label htmlFor="label-settings-display-name">Visningsnamn</Label>
              <Input
                id="label-settings-display-name"
                value={displayName}
                onChange={(event) => {
                  setDisplayName(event.target.value);
                  setError('');
                }}
                disabled={saving}
                required
              />
            </div>

            {showEscalationEmail && (
              <div className="space-y-2">
                <Label htmlFor="label-settings-escalation-email">Eskaleringsadress</Label>
                <Input
                  id="label-settings-escalation-email"
                  type="email"
                  value={escalationEmail}
                  onChange={(event) => {
                    setEscalationEmail(event.target.value);
                    setError('');
                  }}
                  placeholder="namn@domän.se"
                  autoComplete="email"
                  disabled={saving}
                />
                <p className="text-xs text-muted-foreground">Lämna fältet tomt för att ta bort adressen.</p>
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}
          </section>

          <section className="space-y-3 border-t pt-4" aria-labelledby="label-settings-technical">
            <h3 id="label-settings-technical" className="text-sm font-medium">
              Tekniska uppgifter
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="label-settings-classification">Klassificering</Label>
                <Input
                  id="label-settings-classification"
                  value={target?.label.classification ?? ''}
                  readOnly
                  className="bg-muted font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label>Resursnamn</Label>
                <div className="flex h-9 items-center">
                  <LabelCopyValue value={target?.label.resourceName} />
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-3 border-t pt-4" aria-labelledby="label-settings-status">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 id="label-settings-status" className="text-sm font-medium">
                  Status
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Avveckling påverkar även alla underliggande etiketter.
                </p>
              </div>
              <Badge variant={isDeprecated ? 'outline' : 'secondary'}>{isDeprecated ? 'Deprecated' : 'Aktiv'}</Badge>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start"
              disabled={saving || !unchanged}
              onClick={() => onDeprecatedChange(!isDeprecated)}
            >
              {isDeprecated ?
                <RotateCcw className="size-4" />
              : <Ban className="size-4" />}
              {isDeprecated ? 'Återaktivera etikett' : 'Avveckla etikett'}
            </Button>
            {!unchanged && (
              <p className="text-xs text-muted-foreground">
                Spara eller återställ fältändringarna innan du ändrar status.
              </p>
            )}
          </section>

          {canRemove && (
            <section
              className="space-y-3 rounded-md border border-destructive/40 bg-destructive/5 p-3"
              aria-labelledby="label-settings-danger"
            >
              <div>
                <h3 id="label-settings-danger" className="text-sm font-medium text-destructive">
                  Farlig zon
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Permanent borttagning kan inte ångras och omfattar underliggande etiketter.
                </p>
              </div>
              <Button
                type="button"
                variant="destructive"
                className="w-full justify-start"
                disabled={saving || !unchanged}
                onClick={onRemove}
              >
                <Trash2 className="size-4" />
                Ta bort permanent
              </Button>
            </section>
          )}

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
