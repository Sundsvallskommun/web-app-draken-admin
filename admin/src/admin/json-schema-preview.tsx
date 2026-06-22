'use client';

import { Button } from '@components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@components/ui/collapsible';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { Switch } from '@components/ui/switch';
import { Textarea } from '@components/ui/textarea';
import Form, { type FormProps } from '@rjsf/core';
import type {
  FieldTemplateProps,
  ObjectFieldTemplateProps,
  RegistryWidgetsType,
  RJSFSchema,
  RJSFValidationError,
  UiSchema,
  WidgetProps,
} from '@rjsf/utils';
import { customizeValidator } from '@rjsf/validator-ajv8';
import type { TextEditorProps } from '@sk-web-gui/text-editor';
import Ajv2020 from 'ajv/dist/2020';
import { ChevronDown } from 'lucide-react';
import dynamic from 'next/dynamic';
import * as React from 'react';

const TextEditor = dynamic<TextEditorProps>(() => import('@sk-web-gui/text-editor').then((mod) => mod.TextEditor), { ssr: false });

const validator = customizeValidator({ AjvClass: Ajv2020 });

type AnyProp = {
  type?: string | string[];
  format?: string;
  oneOf?: unknown[];
  enum?: unknown[];
  items?: AnyProp;
  widget?: string;
};

type ConditionalRule = {
  if: { properties: Record<string, { const: unknown }> };
  then: { required?: string[]; properties?: Record<string, unknown> };
};

type RowDefinition = { fields: string[]; gap?: string };
type SectionDefinition = { id: string; title: string; fields: string[]; defaultOpen?: boolean };
type PreviewContext = { originalSchema?: RJSFSchema };

const hasType = (prop: AnyProp | undefined, type: string) =>
  typeof prop?.type === 'string' ? prop.type === type : Array.isArray(prop?.type) ? prop.type.includes(type) : false;

const isOneOfStrings = (prop?: AnyProp) =>
  Array.isArray(prop?.oneOf) && prop.oneOf.every((item) => typeof (item as { const?: unknown })?.const === 'string');

const isEnumStrings = (prop?: AnyProp) => Array.isArray(prop?.enum) && prop.enum.every((value) => typeof value === 'string');

function buildUiSchemaFromSchema(schema: RJSFSchema): UiSchema {
  const ui: UiSchema = {};
  const props = (schema?.properties ?? {}) as Record<string, AnyProp>;

  for (const [key, prop] of Object.entries(props)) {
    const entry: Record<string, unknown> = {};

    if (prop.widget) {
      entry['ui:widget'] = prop.widget;
    } else {
      if ((hasType(prop, 'string') || hasType(prop, 'null')) && prop.format === 'date') entry['ui:widget'] = 'date';
      if (
        hasType(prop, 'array') &&
        prop.items &&
        (hasType(prop.items, 'string') || !prop.items.type) &&
        (isOneOfStrings(prop.items) || isEnumStrings(prop.items))
      ) {
        entry['ui:widget'] = 'ComboboxWidget';
      }
      if (hasType(prop, 'string') && (isOneOfStrings(prop) || isEnumStrings(prop))) entry['ui:widget'] ??= 'select';
      if (hasType(prop, 'boolean')) entry['ui:widget'] ??= 'checkbox';
      if (hasType(prop, 'string')) entry['ui:widget'] ??= 'TextWidget';
    }

    if (Object.keys(entry).length) ui[key] = entry;
  }
  return ui;
}

function enumOptions(options: WidgetProps['options']): { value: unknown; label: string }[] {
  return ((options?.enumOptions as { value: unknown; label: string }[] | undefined) ?? []).filter((item) => item.value !== undefined);
}

function TextWidget({ id, value, onChange, disabled, readonly, options }: WidgetProps) {
  return (
    <Input
      id={id}
      className={String(options?.className ?? 'max-w-2xl')}
      value={(value as string | number | undefined) ?? ''}
      disabled={!!(disabled || readonly)}
      placeholder={String(options?.placeholder ?? '')}
      onChange={(event) => onChange(event.currentTarget.value)}
    />
  );
}

function TextareaWidget({ id, value, onChange, disabled, readonly, options }: WidgetProps) {
  return (
    <Textarea
      id={id}
      className={String(options?.className ?? 'max-w-2xl')}
      value={(value as string | undefined) ?? ''}
      disabled={!!(disabled || readonly)}
      placeholder={String(options?.placeholder ?? '')}
      rows={4}
      onChange={(event) => onChange(event.currentTarget.value)}
    />
  );
}

function TexteditorWidget({ value, onChange, disabled, readonly, options }: WidgetProps) {
  return (
    <TextEditor
      className={String(options?.className ?? 'min-h-[220px] max-w-2xl')}
      readOnly={!!(disabled || readonly)}
      value={{ markup: (value as string | undefined) ?? '' }}
      onChange={(event) => onChange(event.target.value.markup ?? '')}
    />
  );
}

function SelectWidget({ value, onChange, disabled, readonly, options }: WidgetProps) {
  const items = enumOptions(options);
  const currentValue = value === undefined || value === null ? '' : String(value);
  return (
    <Select value={currentValue} onValueChange={(next) => onChange(next || undefined)} disabled={!!(disabled || readonly)}>
      <SelectTrigger className="max-w-2xl">
        <SelectValue placeholder={String(options?.placeholder ?? 'Välj...')} />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={String(item.value)} value={String(item.value)}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function RadioWidget({ value, onChange, disabled, readonly, options }: WidgetProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {enumOptions(options).map((item) => (
        <label key={String(item.value)} className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            checked={value === item.value}
            disabled={!!(disabled || readonly)}
            onChange={() => onChange(item.value)}
          />
          {item.label}
        </label>
      ))}
    </div>
  );
}

function CheckboxWidget({ id, label, value, onChange, disabled, readonly }: WidgetProps) {
  return (
    <label className="flex max-w-2xl items-center justify-between gap-3 rounded-md border p-3 text-sm">
      <span>{label}</span>
      <Switch id={id} checked={!!value} disabled={!!(disabled || readonly)} onCheckedChange={onChange} />
    </label>
  );
}

function DateWidget({ id, value, onChange, disabled, readonly }: WidgetProps) {
  return (
    <Input
      id={id}
      type="date"
      className="max-w-sm"
      value={(value as string | undefined) ?? ''}
      disabled={!!(disabled || readonly)}
      onChange={(event) => onChange(event.currentTarget.value)}
    />
  );
}

function ComboboxWidget({ value, onChange, disabled, readonly, options, schema }: WidgetProps) {
  const items = enumOptions(options);
  const multiple = Boolean(options?.multiple ?? ((schema as AnyProp | undefined)?.type === 'array'));
  const current = multiple ? (Array.isArray(value) ? value.map(String) : []) : value == null ? '' : String(value);

  if (multiple) {
    return (
      <select
        multiple
        className="min-h-32 w-full max-w-2xl rounded-md border bg-background p-2 text-sm"
        value={current as string[]}
        disabled={!!(disabled || readonly)}
        onChange={(event) => onChange(Array.from(event.currentTarget.selectedOptions).map((option) => option.value))}
      >
        {items.map((item) => (
          <option key={String(item.value)} value={String(item.value)}>
            {item.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <Select value={current as string} onValueChange={(next) => onChange(next || undefined)} disabled={!!(disabled || readonly)}>
      <SelectTrigger className="max-w-2xl">
        <SelectValue placeholder={String(options?.placeholder ?? 'Välj...')} />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={String(item.value)} value={String(item.value)}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const widgets: RegistryWidgetsType = {
  TextWidget,
  text: TextWidget,
  SelectWidget,
  select: SelectWidget,
  RadioWidget,
  RadiobuttonWidget: RadioWidget,
  radiobutton: RadioWidget,
  radio: RadioWidget,
  CheckboxWidget,
  checkbox: CheckboxWidget,
  DateWidget,
  date: DateWidget,
  ComboboxWidget,
  combobox: ComboboxWidget,
  TexteditorWidget,
  texteditor: TexteditorWidget,
  richtext: TexteditorWidget,
  TextareaWidget,
  textarea: TextareaWidget,
};

function FieldTemplate({ id, label, required, displayLabel, children, uiSchema, rawErrors, schema, help }: FieldTemplateProps) {
  const options = uiSchema?.['ui:options'] ?? {};
  if (uiSchema?.['ui:widget'] === 'hidden') return <>{children}</>;
  const hideLabel = Boolean(options.hideLabel);
  const hideDescription = Boolean(options.hideDescription);
  const descriptionBelow = Boolean(options.descriptionBelow);
  const description = String(uiSchema?.['ui:description'] ?? schema?.description ?? '');
  const hasError = !!rawErrors?.length;
  return (
    <div className={String(options.className ?? 'flex flex-col gap-1.5')}>
      {displayLabel && !hideLabel && (
        <Label htmlFor={id}>
          {label}
          {required ? ' *' : ''}
        </Label>
      )}
      {!hideDescription && !descriptionBelow && description && <p className="text-sm text-muted-foreground">{description}</p>}
      {children}
      {!hideDescription && descriptionBelow && description && <p className="text-sm text-muted-foreground">{description}</p>}
      {hasError && <p className="text-sm text-destructive">{rawErrors?.[0]}</p>}
      {help}
    </div>
  );
}

function conditionMet(condition: ConditionalRule['if'], formData: Record<string, unknown>) {
  return Object.entries(condition.properties ?? {}).every(([field, rule]) => formData[field] === rule.const);
}

function conditionalFields(schema: RJSFSchema): Map<string, ConditionalRule['if']> {
  const result = new Map<string, ConditionalRule['if']>();
  const rules = [...(((schema.allOf as ConditionalRule[] | undefined) ?? [])), ...((schema.if && schema.then ? [{ if: schema.if, then: schema.then }] : []) as ConditionalRule[])];
  for (const rule of rules) {
    const fields = [...(rule.then.required ?? []), ...Object.keys(rule.then.properties ?? {})];
    fields.forEach((field) => result.set(field, rule.if));
  }
  return result;
}

function orderedFields(rawOrder: unknown, propertyNames: string[]) {
  if (!Array.isArray(rawOrder)) return propertyNames;
  const order = rawOrder.filter((item): item is string => typeof item === 'string');
  const used = new Set<string>();
  const resolved: string[] = [];
  for (const item of order) {
    if (item === '*') {
      propertyNames.filter((name) => !used.has(name)).forEach((name) => {
        resolved.push(name);
        used.add(name);
      });
    } else if (propertyNames.includes(item) && !used.has(item)) {
      resolved.push(item);
      used.add(item);
    }
  }
  propertyNames.filter((name) => !used.has(name)).forEach((name) => resolved.push(name));
  return resolved;
}

function renderFields(
  names: string[],
  properties: ObjectFieldTemplateProps['properties'],
  visible: Set<string>,
  rows: RowDefinition[],
  renderedRows: Set<string>
) {
  const rowFields = new Set(rows.flatMap((row) => row.fields));
  return names.map((name) => {
    if (!visible.has(name)) return null;
    const row = rows.find((candidate) => candidate.fields[0] === name);
    if (row) {
      const key = row.fields.join('-');
      if (renderedRows.has(key)) return null;
      renderedRows.add(key);
      return (
        <div key={key} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {row.fields
            .filter((field) => visible.has(field))
            .map((field) => {
              const prop = properties.find((item) => item.name === field);
              return prop ? <div key={field}>{prop.content}</div> : null;
            })}
        </div>
      );
    }
    if (rowFields.has(name)) return null;
    const prop = properties.find((item) => item.name === name);
    return prop ? <div key={name}>{prop.content}</div> : null;
  });
}

function ObjectFieldTemplate(props: ObjectFieldTemplateProps) {
  const { properties, formData, formContext, uiSchema } = props;
  const originalSchema = (formContext as PreviewContext | undefined)?.originalSchema;
  const conditions = originalSchema ? conditionalFields(originalSchema) : new Map<string, ConditionalRule['if']>();
  const visible = new Set<string>();
  for (const prop of properties) {
    const condition = conditions.get(prop.name);
    if (!condition || conditionMet(condition, (formData ?? {}) as Record<string, unknown>)) visible.add(prop.name);
  }

  const rows = ((uiSchema?.['ui:rows'] ?? []) as RowDefinition[]).filter((row) => Array.isArray(row.fields));
  const sections = ((uiSchema?.['ui:sections'] ?? []) as SectionDefinition[]).filter((section) => Array.isArray(section.fields));
  const order = orderedFields(uiSchema?.['ui:order'], properties.map((prop) => prop.name));
  const renderedRows = new Set<string>();

  if (!sections.length) {
    return <div className="flex flex-col gap-4">{renderFields(order, properties, visible, rows, renderedRows)}</div>;
  }

  const sectionFields = new Set(sections.flatMap((section) => section.fields));
  return (
    <div className="flex flex-col gap-4">
      {sections.map((section) => {
        const names = order.filter((name) => section.fields.includes(name) && visible.has(name));
        if (!names.length) return null;
        return (
          <Collapsible key={section.id} defaultOpen={section.defaultOpen ?? true} className="rounded-md border">
            <CollapsibleTrigger asChild>
              <Button type="button" variant="ghost" className="w-full justify-between rounded-none px-4">
                {section.title}
                <ChevronDown className="size-4" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="p-4 pt-0">
              <div className="flex flex-col gap-4">{renderFields(names, properties, visible, rows, renderedRows)}</div>
            </CollapsibleContent>
          </Collapsible>
        );
      })}
      {renderFields(
        order.filter((name) => !sectionFields.has(name)),
        properties,
        visible,
        rows,
        renderedRows
      )}
    </div>
  );
}

function transformErrors(errors: RJSFValidationError[]) {
  return errors.map((error) => ({ ...error, message: error.message ?? 'Ogiltigt värde' }));
}

export function JsonSchemaPreview({ schema, uiSchema, disabled = false }: { schema: RJSFSchema; uiSchema?: UiSchema; disabled?: boolean }) {
  const [formData, setFormData] = React.useState<Record<string, unknown>>({});
  const effectiveUiSchema = React.useMemo(() => uiSchema ?? buildUiSchemaFromSchema(schema), [schema, uiSchema]);
  const formContext = React.useMemo(() => ({ originalSchema: schema }), [schema]);

  if (!schema || typeof schema !== 'object' || !Object.keys(schema).length) {
    return <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">Inget schema att förhandsvisa.</div>;
  }

  const handleChange: NonNullable<FormProps['onChange']> = (event) => {
    setFormData((event.formData ?? {}) as Record<string, unknown>);
  };

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="rounded-md border p-4">
        <Form
          schema={schema}
          uiSchema={effectiveUiSchema}
          formData={formData}
          formContext={formContext}
          onChange={handleChange}
          validator={validator}
          widgets={widgets}
          templates={{ FieldTemplate, ObjectFieldTemplate, ButtonTemplates: { SubmitButton: () => null } }}
          transformErrors={transformErrors}
          noHtml5Validate
          showErrorList={false}
          disabled={disabled}
        />
      </div>
      <div className="rounded-md border bg-muted/40 p-4">
        <h3 className="mb-2 text-sm font-medium">Formulärdata</h3>
        <pre className="max-h-[520px] overflow-auto text-xs">{JSON.stringify(formData, null, 2)}</pre>
      </div>
    </div>
  );
}
