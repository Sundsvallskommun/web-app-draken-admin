import {
  appendLabel,
  canCreateLabelBelow,
  defaultClassificationForParent,
  flattenLabelParents,
  resourceNameFromDisplayName,
  ROOT_PARENT_VALUE,
} from '@admin/label-editor';
import { Button } from '@components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@components/ui/dialog';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import type { LabelNode } from '@interfaces/label';
import { isValidEmail } from '@utils/email';
import { isEscalationEmailApplicable, setEscalationEmail } from '@utils/label-attributes';
import { Loader2 } from 'lucide-react';
import * as React from 'react';

const CLASSIFICATION_OPTIONS = ['CATEGORY', 'TYPE', 'SUBTYPE'];

interface LabelCreateDialogProps {
  data: LabelNode[];
  open: boolean;
  saving: boolean;
  initialParentValue?: string;
  onOpenChange: (open: boolean) => void;
  onCreate: (nextLabels: LabelNode[]) => Promise<void>;
}

export function LabelCreateDialog({
  data,
  open,
  saving,
  initialParentValue = ROOT_PARENT_VALUE,
  onOpenChange,
  onCreate,
}: LabelCreateDialogProps) {
  const classificationListId = React.useId();
  const parentOptions = React.useMemo(() => flattenLabelParents(data), [data]);
  const [parentValue, setParentValue] = React.useState(ROOT_PARENT_VALUE);
  const [classification, setClassification] = React.useState('');
  const [displayName, setDisplayName] = React.useState('');
  const [resourceName, setResourceName] = React.useState('');
  const [resourceNameTouched, setResourceNameTouched] = React.useState(false);
  const [escalationEmail, setEscalationEmailValue] = React.useState('');
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (!open) return;
    const nextParent = parentOptions.find((option) => option.value === initialParentValue) ?? parentOptions[0];
    setParentValue(nextParent.value);
    setClassification(defaultClassificationForParent(nextParent));
    setDisplayName('');
    setResourceName('');
    setResourceNameTouched(false);
    setEscalationEmailValue('');
    setError('');
  }, [initialParentValue, open, parentOptions]);

  const selectedParent = parentOptions.find((option) => option.value === parentValue) ?? parentOptions[0];

  const updateParent = (value: string) => {
    const nextParent = parentOptions.find((option) => option.value === value) ?? parentOptions[0];
    setParentValue(nextParent.value);
    setClassification(defaultClassificationForParent(nextParent));
  };

  const updateDisplayName = (value: string) => {
    setDisplayName(value);
    if (!resourceNameTouched) setResourceName(resourceNameFromDisplayName(value));
  };

  const updateResourceName = (value: string) => {
    setResourceNameTouched(true);
    setResourceName(resourceNameFromDisplayName(value));
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextClassification = classification.trim();
    const nextDisplayName = displayName.trim();
    const nextResourceName = resourceName.trim();

    if (!nextClassification) {
      setError('Klassificering är obligatorisk.');
      return;
    }
    if (!nextDisplayName) {
      setError('Namn är obligatoriskt.');
      return;
    }
    if (!/^[A-Z0-9_]+$/.test(nextResourceName)) {
      setError('Resursnamn får bara innehålla A-Z, 0-9 och _.');
      return;
    }
    if (
      isEscalationEmailApplicable(nextClassification) &&
      escalationEmail.trim() &&
      !isValidEmail(escalationEmail.trim())
    ) {
      setError('Ange en giltig e-postadress, till exempel namn@domän.se.');
      return;
    }
    if (!canCreateLabelBelow(data, selectedParent.value)) {
      setError('Det går inte att lägga till etiketter under en deprecated etikett.');
      return;
    }

    const nextLabel: LabelNode = {
      classification: nextClassification,
      displayName: nextDisplayName,
      resourceName: nextResourceName,
      labels: [],
      attributes: isEscalationEmailApplicable(nextClassification) ? setEscalationEmail([], escalationEmail) : [],
    };

    await onCreate(appendLabel(data, selectedParent.value, nextLabel));
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !saving && onOpenChange(nextOpen)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Lägg till etikett</DialogTitle>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={submit} noValidate>
          <div className="space-y-2">
            <Label>Placering</Label>
            <Select value={parentValue} onValueChange={updateParent} disabled={saving}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {parentOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="label-classification">Klassificering *</Label>
            <Input
              id="label-classification"
              list={classificationListId}
              value={classification}
              onChange={(event) => setClassification(event.target.value)}
              disabled={saving}
              required
            />
            <datalist id={classificationListId}>
              {CLASSIFICATION_OPTIONS.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
          </div>

          <div className="space-y-2">
            <Label htmlFor="label-display-name">Namn</Label>
            <Input
              id="label-display-name"
              value={displayName}
              onChange={(event) => updateDisplayName(event.target.value)}
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="label-resource-name">Resursnamn</Label>
            <Input
              id="label-resource-name"
              value={resourceName}
              onChange={(event) => updateResourceName(event.target.value)}
              disabled={saving}
            />
          </div>

          {isEscalationEmailApplicable(classification) && (
            <div className="space-y-2">
              <Label htmlFor="new-label-escalation-email">Eskaleringsadress</Label>
              <Input
                id="new-label-escalation-email"
                type="email"
                value={escalationEmail}
                onChange={(event) => setEscalationEmailValue(event.target.value)}
                placeholder="namn@domän.se"
                autoComplete="email"
                disabled={saving}
              />
              <p className="text-xs text-muted-foreground">
                Valfritt. Förifylls som mottagare när ett ärende med typen överlämnas via e-post.
              </p>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Avbryt
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              Skapa
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
