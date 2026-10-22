import { CategoryTypesField } from '@admin/category-types-field';
import { MonacoField } from '@admin/monaco-field';
import { type FieldDef } from '@admin/resource-config';
import { RichTextField } from '@admin/rich-text-field';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@components/ui/form';
import { Input } from '@components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { Switch } from '@components/ui/switch';
import { Textarea } from '@components/ui/textarea';
import { type Control, type RegisterOptions } from 'react-hook-form';

/** Radix Select can't have an empty item value, so "no value" gets a sentinel that maps back to ''. */
const EMPTY_SELECT_VALUE = '__none__';

type FormValues = Record<string, unknown>;

export interface ResourceFieldControlProps {
  field: FieldDef;
  control: Control<FormValues>;
  rules?: RegisterOptions<FormValues, string>;
  required?: boolean;
  disabled?: boolean;
  /** Overrides `field.options` for selects (e.g. live namespace or status options). */
  options?: { value: string; label: string }[];
  codeLanguage?: 'json' | 'markdown';
  existingCategoryTypeCount?: number;
  /** Adds an "Ingen" option to selects so an optional value can be cleared. */
  allowEmptySelection?: boolean;
  /** Applied to text input on change, e.g. to force upper case. */
  transformValue?: (value: string) => string;
}

/** One FieldDef rendered as a react-hook-form field, shared by ResourceForm and the namespace wizard. */
export function ResourceFieldControl({
  field,
  control,
  rules,
  required,
  disabled,
  options,
  codeLanguage = 'markdown',
  existingCategoryTypeCount = 0,
  allowEmptySelection,
  transformValue,
}: ResourceFieldControlProps) {
  return (
    <FormField
      control={control}
      name={field.key}
      rules={rules}
      render={({ field: rhf }) => {
        if (field.type === 'switch') {
          return (
            <FormItem className="rounded-lg border p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <FormLabel>{field.label}</FormLabel>
                  {field.help && <FormDescription>{field.help}</FormDescription>}
                </div>
                <FormControl>
                  <Switch checked={Boolean(rhf.value)} onCheckedChange={rhf.onChange} disabled={disabled} />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          );
        }

        return (
          <FormItem>
            <FormLabel>
              {field.label}
              {required && ' *'}
            </FormLabel>
            {field.type === 'select' ?
              <Select
                onValueChange={(value) => rhf.onChange(value === EMPTY_SELECT_VALUE ? '' : value)}
                value={(rhf.value as string) ?? ''}
                disabled={disabled}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Välj ett alternativ" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {allowEmptySelection && <SelectItem value={EMPTY_SELECT_VALUE}>Ingen</SelectItem>}
                  {(options ?? field.options)?.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            : field.type === 'categoryTypes' ?
              <CategoryTypesField
                value={rhf.value}
                onChange={rhf.onChange}
                existingTypeCount={existingCategoryTypeCount}
                disabled={disabled}
              />
            : field.type === 'code' ?
              <MonacoField
                value={(rhf.value as string) ?? ''}
                onChange={rhf.onChange}
                disabled={disabled}
                language={codeLanguage}
              />
            : field.type === 'richtext' ?
              <FormControl>
                <RichTextField value={rhf.value} onChange={rhf.onChange} readOnly={disabled} />
              </FormControl>
            : field.type === 'textarea' ?
              <FormControl>
                <Textarea {...rhf} value={(rhf.value as string) ?? ''} disabled={disabled} rows={3} />
              </FormControl>
            : <FormControl>
                <Input
                  {...rhf}
                  onChange={(event) =>
                    rhf.onChange(transformValue ? transformValue(event.target.value) : event.target.value)
                  }
                  value={(rhf.value as string | number) ?? ''}
                  type={field.type === 'number' ? 'number' : 'text'}
                  disabled={disabled}
                />
              </FormControl>
            }
            {field.help && <FormDescription>{field.help}</FormDescription>}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
