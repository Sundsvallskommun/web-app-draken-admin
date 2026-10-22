import { type FieldDef } from '@admin/resource-config';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Lock, Plus, Trash2 } from 'lucide-react';

export type EditableRow = Record<string, string>;

export interface EditableMetadataListProps {
  /** One column per field; the field labels become the column headers. */
  fields: FieldDef[];
  rows: EditableRow[];
  onChange: (rows: EditableRow[]) => void;
  /** The field that identifies a row, e.g. name. */
  keyField: string;
  emptyRow: () => EditableRow;
  requiredKeys?: string[];
  /** Rows with these keys already exist and can no longer be edited or removed. */
  lockedKeys?: ReadonlySet<string>;
  rowErrors?: Record<number, Record<string, string>>;
  itemLabel: string;
  addLabel: string;
  emptyText: string;
  disabled?: boolean;
}

function EditableMetadataRow({
  fields,
  row,
  rowName,
  requiredKeys,
  errors,
  locked,
  disabled,
  onChange,
  onRemove,
}: {
  fields: FieldDef[];
  row: EditableRow;
  rowName: string;
  requiredKeys: string[];
  errors?: Record<string, string>;
  locked: boolean;
  disabled?: boolean;
  onChange: (changes: EditableRow) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-start gap-2">
        <div className="grid flex-1 gap-2 sm:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))]">
          {fields.map((field) => (
            <Input
              key={field.key}
              aria-label={`${field.label} för ${rowName}`}
              aria-invalid={Boolean(errors?.[field.key])}
              placeholder={`${field.label}${requiredKeys.includes(field.key) ? ' *' : ''}`}
              value={row[field.key] ?? ''}
              onChange={(event) => onChange({ [field.key]: event.target.value })}
              disabled={disabled || locked}
            />
          ))}
        </div>
        {locked ?
          <span className="flex size-9 shrink-0 items-center justify-center text-muted-foreground" title="Redan skapad">
            <Lock className="size-4" aria-label="Redan skapad" />
          </span>
        : <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Ta bort ${rowName}`}
            onClick={onRemove}
            disabled={disabled}
          >
            <Trash2 className="size-4" />
          </Button>
        }
      </div>
      {errors && Object.keys(errors).length > 0 && (
        <ul className="mt-2 space-y-0.5 text-sm text-destructive">
          {Object.entries(errors).map(([key, message]) => (
            <li key={key}>{message}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Rows of plain text fields that are added and removed locally, like CategoryTypesField but driven by FieldDefs. */
export function EditableMetadataList({
  fields,
  rows,
  onChange,
  keyField,
  emptyRow,
  requiredKeys = [],
  lockedKeys,
  rowErrors,
  itemLabel,
  addLabel,
  emptyText,
  disabled,
}: EditableMetadataListProps) {
  const updateRow = (index: number, changes: EditableRow) =>
    onChange(rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...changes } : row)));

  const removeRow = (index: number) => onChange(rows.filter((_, rowIndex) => rowIndex !== index));

  return (
    <div className="space-y-3">
      {rows.length === 0 && <p className="text-sm text-muted-foreground">{emptyText}</p>}

      {rows.map((row, index) => (
        <EditableMetadataRow
          key={index}
          fields={fields}
          row={row}
          rowName={row[keyField]?.trim() || `${itemLabel} ${index + 1}`}
          requiredKeys={requiredKeys}
          errors={rowErrors?.[index]}
          locked={Boolean(lockedKeys?.has(row[keyField]?.trim() ?? ''))}
          disabled={disabled}
          onChange={(changes) => updateRow(index, changes)}
          onRemove={() => removeRow(index)}
        />
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...rows, emptyRow()])}
        disabled={disabled}
      >
        <Plus className="size-4" />
        {addLabel}
      </Button>
    </div>
  );
}
