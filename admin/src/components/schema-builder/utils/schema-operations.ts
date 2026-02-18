/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
// JSON Schema structures are inherently dynamic and require flexible typing
// Unused vars from destructuring are intentional for removing properties

import { RJSFSchema, UiSchema } from '@rjsf/utils';

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'checkbox'
  | 'select'
  | 'combobox'
  | 'radiobutton'
  | 'date'
  | 'richtext';

export interface FieldTypeConfig {
  type: FieldType;
  label: string;
  icon: string;
  schemaType: 'string' | 'number' | 'integer' | 'boolean';
  widget?: string;
  hasEnum?: boolean;
  format?: string;
}

export const FIELD_TYPES: FieldTypeConfig[] = [
  { type: 'text', label: 'Textfält', icon: 'Type', schemaType: 'string', widget: 'TextWidget' },
  { type: 'textarea', label: 'Textområde', icon: 'AlignLeft', schemaType: 'string', widget: 'TextareaWidget' },
  { type: 'number', label: 'Nummer', icon: 'Hash', schemaType: 'number', widget: 'TextWidget' },
  { type: 'checkbox', label: 'Kryssruta', icon: 'CheckSquare', schemaType: 'boolean', widget: 'CheckboxWidget' },
  { type: 'select', label: 'Dropdown', icon: 'ChevronDown', schemaType: 'string', widget: 'select', hasEnum: true },
  { type: 'combobox', label: 'Sökbar dropdown', icon: 'Search', schemaType: 'string', widget: 'ComboboxWidget', hasEnum: true },
  { type: 'radiobutton', label: 'Radioknappar', icon: 'Circle', schemaType: 'string', widget: 'RadiobuttonWidget', hasEnum: true },
  { type: 'date', label: 'Datum', icon: 'Calendar', schemaType: 'string', widget: 'date', format: 'date' },
  { type: 'richtext', label: 'Rich text', icon: 'FileText', schemaType: 'string', widget: 'TexteditorWidget' },
];

export function getFieldTypeConfig(type: FieldType): FieldTypeConfig | undefined {
  return FIELD_TYPES.find((ft) => ft.type === type);
}

/**
 * Generate a unique field name based on type
 */
export function generateFieldName(schema: RJSFSchema, fieldType: FieldType): string {
  const properties = schema.properties || {};
  const existingNames = Object.keys(properties);

  const baseName: string = fieldType;
  let counter = 1;
  let name: string = baseName;

  while (existingNames.includes(name)) {
    name = `${baseName}${counter}`;
    counter++;
  }

  return name;
}

/**
 * Add a new field to the schema
 */
export function addField(
  schema: RJSFSchema,
  uiSchema: UiSchema,
  fieldName: string,
  fieldType: FieldType,
  index?: number
): { schema: RJSFSchema; uiSchema: UiSchema } {
  const config = getFieldTypeConfig(fieldType);
  if (!config) {
    return { schema, uiSchema };
  }

  // Create field schema
  const fieldSchema: Record<string, unknown> = {
    type: config.schemaType,
    title: fieldName,
  };

  // Add format if specified
  if (config.format) {
    fieldSchema.format = config.format;
  }

  // Add enum defaults if needed
  if (config.hasEnum) {
    fieldSchema.enum = ['option1', 'option2', 'option3'];
    fieldSchema.enumNames = ['Alternativ 1', 'Alternativ 2', 'Alternativ 3'];
  }

  // Create new schema with added field
  const newSchema: RJSFSchema = {
    ...schema,
    type: schema.type || 'object',
    properties: {
      ...(schema.properties || {}),
      [fieldName]: fieldSchema,
    },
  };

  // Create UI schema for the field
  const fieldUiSchema: Record<string, unknown> = {};
  if (config.widget) {
    fieldUiSchema['ui:widget'] = config.widget;
  }

  // Update ui:order
  const currentOrder = (uiSchema['ui:order'] as string[]) || Object.keys(schema.properties || {});
  const newOrder = [...currentOrder];

  if (index !== undefined && index >= 0 && index <= newOrder.length) {
    newOrder.splice(index, 0, fieldName);
  } else {
    newOrder.push(fieldName);
  }

  // Create new UI schema
  const newUiSchema: UiSchema = {
    ...uiSchema,
    'ui:order': newOrder,
    [fieldName]: Object.keys(fieldUiSchema).length > 0 ? fieldUiSchema : undefined,
  };

  // Clean up undefined values
  Object.keys(newUiSchema).forEach((key) => {
    if (newUiSchema[key] === undefined) {
      delete newUiSchema[key];
    }
  });

  return { schema: newSchema, uiSchema: newUiSchema };
}

/**
 * Remove a field from the schema
 */
export function removeField(
  schema: RJSFSchema,
  uiSchema: UiSchema,
  fieldName: string
): { schema: RJSFSchema; uiSchema: UiSchema } {
  // Remove from properties
  const { [fieldName]: _, ...remainingProperties } = schema.properties || {};

  // Remove from required array
  const required = (schema.required || []).filter((r: string) => r !== fieldName);

  // First remove any conditions for this field
  let newSchema = removeFieldCondition(schema, fieldName);

  // Update with remaining properties
  newSchema = {
    ...newSchema,
    properties: remainingProperties,
    required: required.length > 0 ? required : undefined,
  };

  // Remove from ui:order and field UI schema
  const { [fieldName]: __, 'ui:order': currentOrder, ...restUiSchema } = uiSchema;
  const newOrder = ((currentOrder as string[]) || []).filter((name) => name !== fieldName);

  const newUiSchema: UiSchema = {
    ...restUiSchema,
    'ui:order': newOrder.length > 0 ? newOrder : undefined,
  };

  // Clean up undefined values
  if (!newSchema.required) delete newSchema.required;
  if (!newUiSchema['ui:order']) delete newUiSchema['ui:order'];

  return { schema: newSchema, uiSchema: newUiSchema };
}

/**
 * Update field properties in the schema
 */
export function updateFieldSchema(
  schema: RJSFSchema,
  fieldName: string,
  updates: Record<string, unknown>
): RJSFSchema {
  const currentField = schema.properties?.[fieldName] || {};

  return {
    ...schema,
    properties: {
      ...(schema.properties || {}),
      [fieldName]: {
        ...currentField,
        ...updates,
      },
    },
  };
}

/**
 * Update field UI schema
 */
export function updateFieldUiSchema(
  uiSchema: UiSchema,
  fieldName: string,
  updates: Record<string, unknown>
): UiSchema {
  const currentFieldUi = uiSchema[fieldName] || {};

  return {
    ...uiSchema,
    [fieldName]: {
      ...currentFieldUi,
      ...updates,
    },
  };
}

/**
 * Rename a field
 */
export function renameField(
  schema: RJSFSchema,
  uiSchema: UiSchema,
  oldName: string,
  newName: string
): { schema: RJSFSchema; uiSchema: UiSchema } {
  if (oldName === newName) {
    return { schema, uiSchema };
  }

  // Check if new name already exists
  if (schema.properties?.[newName]) {
    return { schema, uiSchema };
  }

  // Rename in properties
  const { [oldName]: fieldSchema, ...otherProperties } = schema.properties || {};
  const newProperties = {
    ...otherProperties,
    [newName]: { ...fieldSchema, title: (fieldSchema as any)?.title === oldName ? newName : (fieldSchema as any)?.title },
  };

  // Rename in required array
  const required = (schema.required || []).map((r: string) => (r === oldName ? newName : r));

  // Create new schema
  const newSchema: RJSFSchema = {
    ...schema,
    properties: newProperties,
    required: required.length > 0 ? required : undefined,
  };

  // Rename in UI schema
  const { [oldName]: fieldUiSchema, 'ui:order': currentOrder, ...restUiSchema } = uiSchema;
  const newOrder = ((currentOrder as string[]) || []).map((name) => (name === oldName ? newName : name));

  const newUiSchema: UiSchema = {
    ...restUiSchema,
    'ui:order': newOrder.length > 0 ? newOrder : undefined,
    ...(fieldUiSchema ? { [newName]: fieldUiSchema } : {}),
  };

  // Clean up
  if (!newSchema.required) delete newSchema.required;
  if (!newUiSchema['ui:order']) delete newUiSchema['ui:order'];

  return { schema: newSchema, uiSchema: newUiSchema };
}

/**
 * Toggle required status for a field
 */
export function toggleRequired(schema: RJSFSchema, fieldName: string): RJSFSchema {
  const required = schema.required || [];
  const isRequired = required.includes(fieldName);

  const newRequired = isRequired
    ? required.filter((r: string) => r !== fieldName)
    : [...required, fieldName];

  return {
    ...schema,
    required: newRequired.length > 0 ? newRequired : undefined,
  };
}

/**
 * Reorder fields by updating ui:order
 */
export function reorderFields(
  uiSchema: UiSchema,
  fromIndex: number,
  toIndex: number
): UiSchema {
  const order = [...((uiSchema['ui:order'] as string[]) || [])];

  if (fromIndex < 0 || fromIndex >= order.length || toIndex < 0 || toIndex >= order.length) {
    return uiSchema;
  }

  const [removed] = order.splice(fromIndex, 1);
  order.splice(toIndex, 0, removed);

  return {
    ...uiSchema,
    'ui:order': order,
  };
}

/**
 * Get field order from UI schema, or generate from schema properties
 */
export function getFieldOrder(schema: RJSFSchema, uiSchema: UiSchema): string[] {
  const uiOrder = uiSchema['ui:order'] as string[] | undefined;
  if (uiOrder && uiOrder.length > 0) {
    return uiOrder.filter((name) => name !== '*' && schema.properties?.[name]);
  }
  return Object.keys(schema.properties || {});
}

/**
 * Get field info for display
 */
export function getFieldInfo(
  schema: RJSFSchema,
  uiSchema: UiSchema,
  fieldName: string
): {
  name: string;
  title: string;
  type: string;
  widget: string;
  required: boolean;
  fieldType: FieldType;
  hasCondition: boolean;
} {
  const fieldSchema = schema.properties?.[fieldName] || {};
  const fieldUi = uiSchema[fieldName] || {};
  const schemaType = (fieldSchema as any).type || 'string';
  const widget = (fieldUi as any)['ui:widget'] || '';
  const format = (fieldSchema as any).format || '';
  const hasEnum = !!(fieldSchema as any).enum || !!(fieldSchema as any).oneOf;

  // Check if required in root or has conditional requirement
  const required = (schema.required || []).includes(fieldName);
  const condition = getFieldCondition(schema, fieldName);
  const hasCondition = !!condition;

  // Normalize widget name for comparison (case-insensitive)
  const widgetLower = widget.toLowerCase();

  // Determine field type based on widget and schema
  let fieldType: FieldType = 'text';
  if (schemaType === 'boolean') {
    fieldType = 'checkbox';
  } else if (schemaType === 'number' || schemaType === 'integer') {
    fieldType = 'number';
  } else if (widgetLower === 'textarea' || widgetLower === 'textareawidget') {
    fieldType = 'textarea';
  } else if (widgetLower === 'texteditor' || widgetLower === 'texteditorwidget' || widgetLower === 'richtext') {
    fieldType = 'richtext';
  } else if (widgetLower === 'date' || widgetLower === 'datewidget' || format === 'date') {
    fieldType = 'date';
  } else if (widgetLower === 'combobox' || widgetLower === 'comboboxwidget') {
    fieldType = 'combobox';
  } else if (widgetLower === 'radiobutton' || widgetLower === 'radiobuttonwidget' || widgetLower === 'radio') {
    fieldType = 'radiobutton';
  } else if (widgetLower === 'select' || widgetLower === 'selectwidget' || hasEnum) {
    fieldType = 'select';
  }

  return {
    name: fieldName,
    title: (fieldSchema as any).title || fieldName,
    type: schemaType,
    widget,
    required,
    fieldType,
    hasCondition,
  };
}

/**
 * Condition interface for conditional field visibility/requirements
 */
export interface FieldCondition {
  dependsOnField: string;
  dependsOnValue: string;
  requiredWhenVisible?: boolean;
}

/**
 * Get the condition for a field from the schema's allOf array
 */
export function getFieldCondition(schema: RJSFSchema, fieldName: string): FieldCondition | null {
  const allOf = schema.allOf as any[] | undefined;
  if (!allOf || !Array.isArray(allOf)) {
    return null;
  }

  for (const condition of allOf) {
    if (!condition.if?.properties || !condition.then) {
      continue;
    }

    // Check if this condition's "then" references our field
    const thenRequired = condition.then.required as string[] | undefined;
    const thenProperties = condition.then.properties as Record<string, any> | undefined;

    const isFieldInThen =
      (thenRequired && thenRequired.includes(fieldName)) ||
      (thenProperties && fieldName in thenProperties);

    if (isFieldInThen) {
      // Find which field this depends on
      const ifProperties = condition.if.properties as Record<string, any>;
      const dependsOnField = Object.keys(ifProperties)[0];

      if (dependsOnField) {
        const dependsOnValue = ifProperties[dependsOnField].const;
        const requiredWhenVisible = thenRequired?.includes(fieldName) || false;

        return {
          dependsOnField,
          dependsOnValue: String(dependsOnValue),
          requiredWhenVisible,
        };
      }
    }
  }

  return null;
}

/**
 * Set or update a condition for a field
 * Uses the existing format: field stays in root properties, allOf has if/then with required
 * The schema-transformer handles converting this to RJSF-compatible format for preview
 */
export function setFieldCondition(
  schema: RJSFSchema,
  fieldName: string,
  condition: FieldCondition | null
): RJSFSchema {
  // First, remove any existing condition for this field
  const newSchema = removeFieldCondition(schema, fieldName);

  if (!condition || !condition.dependsOnField || !condition.dependsOnValue) {
    return newSchema;
  }

  // Create the new condition (field stays in root properties)
  const newCondition: any = {
    if: {
      properties: {
        [condition.dependsOnField]: {
          const: condition.dependsOnValue,
        },
      },
    },
    then: {
      required: [fieldName],
    },
  };

  // Get existing allOf or create new array
  const allOf = (newSchema.allOf as any[]) || [];
  allOf.push(newCondition);

  return {
    ...newSchema,
    allOf,
  };
}

/**
 * Remove a condition for a field
 */
export function removeFieldCondition(schema: RJSFSchema, fieldName: string): RJSFSchema {
  const allOf = schema.allOf as any[] | undefined;
  if (!allOf || !Array.isArray(allOf)) {
    return schema;
  }

  const newAllOf = allOf.filter((condition) => {
    if (!condition.then) {
      return true;
    }

    const thenRequired = condition.then.required as string[] | undefined;
    const thenProperties = condition.then.properties as Record<string, any> | undefined;

    // Remove this condition if it references our field
    const isFieldInThen =
      (thenRequired && thenRequired.includes(fieldName)) ||
      (thenProperties && fieldName in thenProperties);

    return !isFieldInThen;
  });

  const newSchema = { ...schema };

  if (newAllOf.length > 0) {
    newSchema.allOf = newAllOf;
  } else {
    delete newSchema.allOf;
  }

  return newSchema;
}

/**
 * Get all fields that can be used as condition sources (fields with enum/oneOf values)
 */
export function getConditionSourceFields(schema: RJSFSchema): { name: string; values: { value: string; label: string }[] }[] {
  const result: { name: string; values: { value: string; label: string }[] }[] = [];
  const properties = schema.properties || {};

  for (const [fieldName, fieldSchema] of Object.entries(properties)) {
    const field = fieldSchema as any;
    const values: { value: string; label: string }[] = [];

    // Check for enum
    if (field.enum && Array.isArray(field.enum)) {
      const enumNames = field.enumNames || field.enum;
      field.enum.forEach((value: any, index: number) => {
        values.push({
          value: String(value),
          label: String(enumNames[index] || value),
        });
      });
    }

    // Check for oneOf
    if (field.oneOf && Array.isArray(field.oneOf)) {
      for (const option of field.oneOf) {
        if (option.const !== undefined) {
          values.push({
            value: String(option.const),
            label: option.title || String(option.const),
          });
        }
      }
    }

    if (values.length > 0) {
      result.push({ name: fieldName, values });
    }
  }

  return result;
}
