import {
  appendLabel,
  defaultClassificationForDepth,
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
  const [classification, setClassification] = React.useState(defaultClassificationForDepth(0));
  const [displayName, setDisplayName] = React.useState('');
  const [resourceName, setResourceName] = React.useState('');
  const [resourceNameTouched, setResourceNameTouched] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (!open) return;
    const nextParent = parentOptions.find((option) => option.value === initialParentValue) ?? parentOptions[0];
    setParentValue(nextParent.value);
    setClassification(defaultClassificationForDepth(nextParent.depth + 1));
    setDisplayName('');
    setResourceName('');
    setResourceNameTouched(false);
    setError('');
  }, [initialParentValue, open, parentOptions]);

  const selectedParent = parentOptions.find((option) => option.value === parentValue) ?? parentOptions[0];

  const updateParent = (value: string) => {
    const nextParent = parentOptions.find((option) => option.value === value) ?? parentOptions[0];
    setParentValue(nextParent.value);
    setClassification(defaultClassificationForDepth(nextParent.depth + 1));
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

    const nextLabel: LabelNode = {
      classification: nextClassification,
      displayName: nextDisplayName,
      resourceName: nextResourceName,
      labels: [],
      attributes: [],
    };

    await onCreate(appendLabel(data, selectedParent.value, nextLabel));
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !saving && onOpenChange(nextOpen)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Lägg till etikett</DialogTitle>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={submit}>
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
            <Label htmlFor="label-classification">Klassificering</Label>
            <Input
              id="label-classification"
              list={classificationListId}
              value={classification}
              onChange={(event) => setClassification(event.target.value)}
              disabled={saving}
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
