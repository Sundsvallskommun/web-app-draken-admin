import { type CategoryTypeRow, emptyCategoryTypeRow, toCategoryTypeRows } from '@admin/category-types';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { Switch } from '@components/ui/switch';
import { Plus, Trash2 } from 'lucide-react';
import * as React from 'react';

/**
 * Editor for the types of a category. Types that already exist keep their name, since it is
 * their key, and are deprecated instead of removed; only unsaved types can be removed.
 * Existing types are never removed or reordered, so they are always the first `existingTypeCount` rows.
 */
export function CategoryTypesField({
  value,
  onChange,
  existingTypeCount,
  disabled,
}: {
  value: unknown;
  onChange: (rows: CategoryTypeRow[]) => void;
  existingTypeCount: number;
  disabled?: boolean;
}) {
  const rows = toCategoryTypeRows(value);

  const updateRow = (index: number, changes: Partial<CategoryTypeRow>) =>
    onChange(rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...changes } : row)));

  const removeRow = (index: number) => onChange(rows.filter((_, rowIndex) => rowIndex !== index));

  return (
    <div className="space-y-3">
      {rows.length === 0 && <p className="text-sm text-muted-foreground">Inga typer ännu.</p>}

      {rows.map((row, index) => {
        const isExisting = index < existingTypeCount;
        const typeLabel = row.displayName || row.name || `typ ${index + 1}`;
        return (
          <div key={index} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-2">
            <Input
              aria-label={`Namn för ${typeLabel}`}
              placeholder="Namn"
              value={row.name}
              onChange={(event) => updateRow(index, { name: event.target.value })}
              disabled={disabled || isExisting}
            />
            <Input
              aria-label={`Visningsnamn för ${typeLabel}`}
              placeholder="Visningsnamn"
              value={row.displayName}
              onChange={(event) => updateRow(index, { displayName: event.target.value })}
              disabled={disabled}
            />
            <Input
              aria-label={`Eskaleringsadress för ${typeLabel}`}
              type="email"
              placeholder="Eskaleringsadress, t.ex. namn@domän.se"
              autoComplete="email"
              value={row.escalationEmail}
              onChange={(event) => updateRow(index, { escalationEmail: event.target.value })}
              disabled={disabled}
            />
            <div className="flex items-center justify-between gap-3">
              {isExisting ?
                <div className="flex items-center gap-2">
                  <Switch
                    id={`category-type-${index}-deprecated`}
                    checked={row.deprecated}
                    onCheckedChange={(checked) => updateRow(index, { deprecated: checked })}
                    disabled={disabled}
                  />
                  <Label htmlFor={`category-type-${index}-deprecated`}>Deprecated</Label>
                </div>
              : <span className="text-xs text-muted-foreground">Ny typ</span>}
              {!isExisting && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Ta bort ${typeLabel}`}
                  onClick={() => removeRow(index)}
                  disabled={disabled}
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
          </div>
        );
      })}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...rows, emptyCategoryTypeRow()])}
        disabled={disabled}
      >
        <Plus className="size-4" />
        Lägg till typ
      </Button>
    </div>
  );
}
