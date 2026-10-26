import { LabelCopyValue } from '@admin/label-copy-value';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@components/ui/alert-dialog';
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
import type { LabelAttribute, LabelNode } from '@interfaces/label';
import { isValidEmail } from '@utils/email';
import { ESCALATION_EMAIL_KEY, getEscalationEmail, isEscalationEmailApplicable } from '@utils/label-attributes';
import { Ban, Loader2, Plus, RotateCcw, Trash2, X } from 'lucide-react';
import * as React from 'react';

export interface LabelSettingsTarget {
  label: LabelNode;
  labelValue: string;
}

export interface LabelSettingsValues {
  displayName: string;
  escalationEmail?: string;
  /** Free-form attributes without the escalation address, which has its own field. */
  attributes: LabelAttribute[];
}

interface AttributeRow extends LabelAttribute {
  /** Stable across edits so the inputs keep focus when rows are added or removed. */
  rowId: number;
}

const toAttributeRows = (attributes: LabelAttribute[]): AttributeRow[] =>
  attributes.map((attribute, index) => ({ ...attribute, rowId: index }));

const trimAttributes = (rows: AttributeRow[]): LabelAttribute[] =>
  rows
    .map(({ key, value }) => ({ key: key.trim(), value: value.trim() }))
    .filter((attribute) => attribute.key || attribute.value);

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
  const [attributeRows, setAttributeRows] = React.useState<AttributeRow[]>([]);
  const [error, setError] = React.useState('');
  const [rowPendingRemoval, setRowPendingRemoval] = React.useState<AttributeRow | null>(null);
  const nextRowId = React.useRef(0);

  const currentDisplayName = target?.label.displayName ?? '';
  const currentEscalationEmail = target ? getEscalationEmail(target.label) : '';
  const showEscalationEmail = Boolean(
    target && (isEscalationEmailApplicable(target.label.classification) || currentEscalationEmail)
  );
  const isDeprecated = target?.label.deprecated === true;
  /** The escalation address has its own editable field above, so it is not repeated in the list. */
  const currentAttributes = React.useMemo(
    () =>
      (target?.label.attributes ?? []).filter(
        (attribute) => !(showEscalationEmail && attribute.key === ESCALATION_EMAIL_KEY)
      ),
    [showEscalationEmail, target]
  );
  const trimmedDisplayName = displayName.trim();
  const trimmedEscalationEmail = escalationEmail.trim();
  const trimmedAttributes = trimAttributes(attributeRows);
  const unchanged =
    trimmedDisplayName === currentDisplayName.trim() &&
    (!showEscalationEmail || trimmedEscalationEmail === currentEscalationEmail.trim()) &&
    JSON.stringify(trimmedAttributes) === JSON.stringify(trimAttributes(toAttributeRows(currentAttributes)));

  React.useEffect(() => {
    if (!open) return;
    setDisplayName(currentDisplayName);
    setEscalationEmail(currentEscalationEmail);
    setAttributeRows(toAttributeRows(currentAttributes));
    nextRowId.current = currentAttributes.length;
    setRowPendingRemoval(null);
    setError('');
  }, [currentAttributes, currentDisplayName, currentEscalationEmail, open]);

  const updateAttribute = (rowId: number, field: 'key' | 'value', fieldValue: string) => {
    setAttributeRows((rows) => rows.map((row) => (row.rowId === rowId ? { ...row, [field]: fieldValue } : row)));
    setError('');
  };

  const addAttribute = () => {
    setAttributeRows((rows) => [...rows, { rowId: nextRowId.current++, key: '', value: '' }]);
    setError('');
  };

  const removeAttribute = (rowId: number) => {
    setAttributeRows((rows) => rows.filter((row) => row.rowId !== rowId));
    setRowPendingRemoval(null);
    setError('');
  };

  /** Empty rows are only scaffolding, so they are dropped without asking. */
  const requestRemoveAttribute = (row: AttributeRow) => {
    if (!row.key.trim() && !row.value.trim()) {
      removeAttribute(row.rowId);
      return;
    }
    setRowPendingRemoval(row);
  };

  const save = async () => {
    if (!trimmedDisplayName) {
      setError('Visningsnamn är obligatoriskt.');
      return;
    }
    if (showEscalationEmail && trimmedEscalationEmail && !isValidEmail(trimmedEscalationEmail)) {
      setError('Ange en giltig e-postadress, till exempel namn@domän.se.');
      return;
    }
    if (trimmedAttributes.some((attribute) => !attribute.key)) {
      setError('Alla attribut måste ha en nyckel.');
      return;
    }
    if (showEscalationEmail && trimmedAttributes.some((attribute) => attribute.key === ESCALATION_EMAIL_KEY)) {
      setError(`Använd fältet Eskaleringsadress i stället för attributet ${ESCALATION_EMAIL_KEY}.`);
      return;
    }
    const attributeKeys = trimmedAttributes.map((attribute) => attribute.key);
    if (new Set(attributeKeys).size !== attributeKeys.length) {
      setError('Varje attributnyckel får bara förekomma en gång.');
      return;
    }

    setError('');
    await onSave({
      displayName: trimmedDisplayName,
      ...(showEscalationEmail ? { escalationEmail: trimmedEscalationEmail } : {}),
      attributes: trimmedAttributes,
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

          <section className="space-y-3 border-t pt-4" aria-labelledby="label-settings-attributes">
            <div>
              <h3 id="label-settings-attributes" className="text-sm font-medium">
                Attribut
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Fria nyckel/värde-par som följer med etiketten. Nyckeln måste vara unik.
              </p>
            </div>

            {attributeRows.length === 0 ?
              <p className="text-sm text-muted-foreground">Inga attribut.</p>
            : <ul className="space-y-2">
                {attributeRows.map((row, index) => (
                  <li key={row.rowId} className="flex items-start gap-2">
                    <Input
                      aria-label={`Attributnyckel ${index + 1}`}
                      value={row.key}
                      onChange={(event) => updateAttribute(row.rowId, 'key', event.target.value)}
                      placeholder="nyckel"
                      className="font-mono sm:max-w-[14rem]"
                      disabled={saving}
                    />
                    <Input
                      aria-label={`Attributvärde ${index + 1}`}
                      value={row.value}
                      onChange={(event) => updateAttribute(row.rowId, 'value', event.target.value)}
                      placeholder="värde"
                      disabled={saving}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      aria-label={`Ta bort attribut ${row.key || index + 1}`}
                      disabled={saving}
                      onClick={() => requestRemoveAttribute(row)}
                    >
                      <X className="size-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            }

            <Button type="button" variant="outline" size="sm" onClick={addAttribute} disabled={saving}>
              <Plus className="size-4" />
              Lägg till attribut
            </Button>
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

      <AlertDialog
        open={rowPendingRemoval !== null}
        onOpenChange={(nextOpen) => !nextOpen && setRowPendingRemoval(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Ta bort attributet {rowPendingRemoval?.key.trim() || rowPendingRemoval?.value.trim()}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Attributet tas bort från etiketten när du sparar inställningarna.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => rowPendingRemoval && removeAttribute(rowPendingRemoval.rowId)}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Ta bort
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
