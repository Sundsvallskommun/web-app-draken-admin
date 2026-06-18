'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
// JSON Schema structures are inherently dynamic and require flexible typing

import { RJSFSchema, UiSchema } from '@rjsf/utils';
import { Checkbox, FormControl, FormLabel, Input, Select, Textarea } from '@sk-web-gui/react';
import { useTranslation } from 'next-i18next';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FIELD_TYPES,
  getFieldInfo,
  getFieldCondition,
  getConditionSourceFields,
  FieldCondition,
} from '../utils/schema-operations';

interface FieldInspectorProps {
  schema: RJSFSchema;
  uiSchema: UiSchema;
  selectedField: string | null;
  onUpdateSchema: (fieldName: string, updates: Record<string, unknown>) => void;
  onUpdateUiSchema: (fieldName: string, updates: Record<string, unknown>) => void;
  onRenameField: (oldName: string, newName: string) => void;
  onToggleRequired: (fieldName: string) => void;
  onUpdateCondition: (fieldName: string, condition: FieldCondition | null) => void;
}

// Separate component for condition editing to avoid re-render issues
function ConditionSection({
  schema,
  selectedField,
  onUpdateCondition,
}: {
  schema: RJSFSchema;
  selectedField: string;
  onUpdateCondition: (fieldName: string, condition: FieldCondition | null) => void;
}) {
  const { t } = useTranslation('jsonSchemas');

  // Get available source fields (fields with enum/oneOf)
  const sourceFields = useMemo(() => getConditionSourceFields(schema), [schema]);

  // Get current condition for this field
  const currentCondition = useMemo(
    () => getFieldCondition(schema, selectedField),
    [schema, selectedField]
  );

  const [hasCondition, setHasCondition] = useState(!!currentCondition);
  const [dependsOnField, setDependsOnField] = useState(currentCondition?.dependsOnField || '');
  const [dependsOnValue, setDependsOnValue] = useState(currentCondition?.dependsOnValue || '');
  const [requiredWhenVisible, setRequiredWhenVisible] = useState(
    currentCondition?.requiredWhenVisible || false
  );

  // Sync local state when selected field changes
  useEffect(() => {
    const condition = getFieldCondition(schema, selectedField);
    setHasCondition(!!condition);
    setDependsOnField(condition?.dependsOnField || '');
    setDependsOnValue(condition?.dependsOnValue || '');
    setRequiredWhenVisible(condition?.requiredWhenVisible || false);
  }, [selectedField, schema]);

  // Get available values for the selected source field
  const availableValues = useMemo(() => {
    if (!dependsOnField) return [];
    const sourceField = sourceFields.find((f) => f.name === dependsOnField);
    return sourceField?.values || [];
  }, [dependsOnField, sourceFields]);

  const handleToggleCondition = useCallback(
    (enabled: boolean) => {
      setHasCondition(enabled);
      if (!enabled) {
        onUpdateCondition(selectedField, null);
        setDependsOnField('');
        setDependsOnValue('');
        setRequiredWhenVisible(false);
      }
    },
    [selectedField, onUpdateCondition]
  );

  const handleFieldChange = useCallback(
    (fieldName: string) => {
      setDependsOnField(fieldName);
      setDependsOnValue(''); // Reset value when field changes
      if (fieldName) {
        // Don't update condition yet - wait for value selection
      } else {
        onUpdateCondition(selectedField, null);
      }
    },
    [selectedField, onUpdateCondition]
  );

  const handleValueChange = useCallback(
    (value: string) => {
      setDependsOnValue(value);
      if (dependsOnField && value) {
        onUpdateCondition(selectedField, {
          dependsOnField,
          dependsOnValue: value,
          requiredWhenVisible,
        });
      }
    },
    [selectedField, dependsOnField, requiredWhenVisible, onUpdateCondition]
  );

  const handleRequiredChange = useCallback(
    (checked: boolean) => {
      setRequiredWhenVisible(checked);
      if (dependsOnField && dependsOnValue) {
        onUpdateCondition(selectedField, {
          dependsOnField,
          dependsOnValue,
          requiredWhenVisible: checked,
        });
      }
    },
    [selectedField, dependsOnField, dependsOnValue, onUpdateCondition]
  );

  // Don't show if no source fields available
  if (sourceFields.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-12">
      <FormControl className="w-full">
        <Checkbox checked={hasCondition} onChange={(e) => handleToggleCondition(e.target.checked)}>
          {t('builder.properties.has_condition', 'Villkorlig visning')}
        </Checkbox>
      </FormControl>

      {hasCondition && (
        <div className="flex flex-col gap-12 pl-6">
          <FormControl className="w-full">
            <FormLabel>{t('builder.properties.depends_on_field', 'Visa om fält')}</FormLabel>
            <Select
              value={dependsOnField}
              onChange={(e) => handleFieldChange(e.target.value)}
              className="w-full"
            >
              <Select.Option value="">{t('builder.select_field', 'Välj fält...')}</Select.Option>
              {sourceFields
                .filter((f) => f.name !== selectedField)
                .map((field) => (
                  <Select.Option key={field.name} value={field.name}>
                    {(schema.properties?.[field.name] as any)?.title || field.name}
                  </Select.Option>
                ))}
            </Select>
          </FormControl>

          {dependsOnField && availableValues.length > 0 && (
            <FormControl className="w-full">
              <FormLabel>{t('builder.properties.depends_on_value', 'har värde')}</FormLabel>
              <Select
                value={dependsOnValue}
                onChange={(e) => handleValueChange(e.target.value)}
                className="w-full"
              >
                <Select.Option value="">{t('builder.select_value', 'Välj värde...')}</Select.Option>
                {availableValues.map((val) => (
                  <Select.Option key={val.value} value={val.value}>
                    {val.label}
                  </Select.Option>
                ))}
              </Select>
            </FormControl>
          )}

          {dependsOnField && dependsOnValue && (
            <FormControl className="w-full">
              <Checkbox
                checked={requiredWhenVisible}
                onChange={(e) => handleRequiredChange(e.target.checked)}
              >
                {t('builder.properties.required_when_visible', 'Obligatorisk om synlig')}
              </Checkbox>
            </FormControl>
          )}
        </div>
      )}
    </div>
  );
}

export function FieldInspector({
  schema,
  uiSchema,
  selectedField,
  onUpdateSchema,
  onUpdateUiSchema,
  onRenameField,
  onToggleRequired,
  onUpdateCondition,
}: FieldInspectorProps) {
  const { t } = useTranslation('jsonSchemas');
  const [localName, setLocalName] = useState('');
  const [localTitle, setLocalTitle] = useState('');

  // Memoize field info to prevent infinite re-renders
  const fieldInfo = useMemo(
    () => (selectedField ? getFieldInfo(schema, uiSchema, selectedField) : null),
    [schema, uiSchema, selectedField]
  );

  const fieldSchema = useMemo(
    () => (selectedField ? (schema.properties?.[selectedField] || {}) : {}),
    [schema, selectedField]
  );

  const fieldUiSchema = useMemo(
    () => (selectedField ? (uiSchema[selectedField] || {}) : {}),
    [uiSchema, selectedField]
  );

  // Sync local state with field data - only when selected field changes
  useEffect(() => {
    if (selectedField && fieldInfo) {
      setLocalName(fieldInfo.name);
      setLocalTitle(fieldInfo.title);
    }
  }, [selectedField]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleNameBlur = useCallback(() => {
    if (selectedField && localName && localName !== selectedField) {
      onRenameField(selectedField, localName);
    }
  }, [selectedField, localName, onRenameField]);

  const handleTitleChange = useCallback((value: string) => {
    setLocalTitle(value);
    if (selectedField) {
      onUpdateSchema(selectedField, { title: value });
    }
  }, [selectedField, onUpdateSchema]);

  const handleDescriptionChange = useCallback((value: string) => {
    if (selectedField) {
      onUpdateSchema(selectedField, { description: value || undefined });
    }
  }, [selectedField, onUpdateSchema]);

  const handleUiTitleChange = useCallback((value: string) => {
    if (selectedField) {
      onUpdateUiSchema(selectedField, {
        'ui:title': value || undefined,
      });
    }
  }, [selectedField, onUpdateUiSchema]);

  const handleUiDescriptionChange = useCallback((value: string) => {
    if (selectedField) {
      onUpdateUiSchema(selectedField, {
        'ui:description': value || undefined,
      });
    }
  }, [selectedField, onUpdateUiSchema]);

  const handleDescriptionBelowChange = useCallback((checked: boolean) => {
    if (selectedField) {
      const currentOptions = (fieldUiSchema as any)['ui:options'] || {};
      onUpdateUiSchema(selectedField, {
        'ui:options': {
          ...currentOptions,
          descriptionBelow: checked || undefined,
        },
      });
    }
  }, [selectedField, fieldUiSchema, onUpdateUiSchema]);

  const handlePlaceholderChange = useCallback((value: string) => {
    if (selectedField) {
      const currentOptions = (fieldUiSchema as any)['ui:options'] || {};
      onUpdateUiSchema(selectedField, {
        'ui:options': { ...currentOptions, placeholder: value || undefined },
      });
    }
  }, [selectedField, fieldUiSchema, onUpdateUiSchema]);

  const handleWidgetChange = useCallback((value: string) => {
    if (selectedField) {
      onUpdateUiSchema(selectedField, {
        'ui:widget': value || undefined,
      });

      // If changing to a widget that needs options, add default enum values
      const widgetLower = value.toLowerCase();
      const needsOptions = ['select', 'combobox', 'comboboxwidget', 'radiobutton', 'radiobuttonwidget'].includes(widgetLower);
      const currentEnums = (fieldSchema as any).enum || [];
      const currentOneOf = (fieldSchema as any).oneOf || [];

      if (needsOptions && currentEnums.length === 0 && currentOneOf.length === 0) {
        onUpdateSchema(selectedField, {
          enum: ['option1', 'option2', 'option3'],
          enumNames: ['Alternativ 1', 'Alternativ 2', 'Alternativ 3'],
        });
      }
    }
  }, [selectedField, fieldSchema, onUpdateUiSchema, onUpdateSchema]);

  const handleLayoutChange = useCallback((paired: boolean) => {
    if (selectedField) {
      const currentOptions = (fieldUiSchema as any)['ui:options'] || {};
      onUpdateUiSchema(selectedField, {
        'ui:options': {
          ...currentOptions,
          layout: paired ? 'paired' : undefined,
        },
      });
    }
  }, [selectedField, fieldUiSchema, onUpdateUiSchema]);

  const handleEnumChange = useCallback((enumValues: string[], enumNames: string[]) => {
    if (selectedField) {
      onUpdateSchema(selectedField, {
        enum: enumValues.length > 0 ? enumValues : undefined,
        enumNames: enumNames.length > 0 ? enumNames : undefined,
        oneOf: undefined, // Clear oneOf when using enum
      });
    }
  }, [selectedField, onUpdateSchema]);

  const handleOneOfChange = useCallback((options: { value: string; label: string }[]) => {
    if (selectedField) {
      onUpdateSchema(selectedField, {
        oneOf: options.length > 0
          ? options.map(opt => ({ const: opt.value, title: opt.label }))
          : undefined,
        enum: undefined, // Clear enum when using oneOf
        enumNames: undefined,
      });
    }
  }, [selectedField, onUpdateSchema]);

  if (!selectedField || !fieldInfo) {
    return (
      <div className="flex-1 min-w-[280px] border-l border-divider bg-background-content flex flex-col h-full">
        <div className="px-16 pt-16 pb-8">
          <h3 className="font-semibold text-base m-0">
            {t('builder.inspector_title', 'Egenskaper')}
          </h3>
        </div>
        <div className="flex-1 flex items-center justify-center text-secondary text-center px-16">
          {t('builder.inspector_empty', 'Välj ett fält för att redigera')}
        </div>
      </div>
    );
  }

  const currentEnums = (fieldSchema as any).enum || [];
  const currentEnumNames = (fieldSchema as any).enumNames || currentEnums;
  const currentOneOf = (fieldSchema as any).oneOf || [];

  // Check if current widget needs options
  const currentWidget = ((fieldUiSchema as any)['ui:widget'] || '').toLowerCase();
  const widgetNeedsOptions = ['select', 'combobox', 'comboboxwidget', 'radio', 'radiobutton', 'radiobuttonwidget'].includes(currentWidget);

  // Show options editor if field type supports enum OR widget needs options OR already has enum/oneOf
  const fieldTypeHasEnum = FIELD_TYPES.find((ft) => ft.type === fieldInfo.fieldType)?.hasEnum;
  const hasEnum = fieldTypeHasEnum || widgetNeedsOptions || currentEnums.length > 0 || currentOneOf.length > 0;
  const isPaired = (fieldUiSchema as any)['ui:options']?.layout === 'paired';

  // Determine if using oneOf or enum format
  const usesOneOf = currentOneOf.length > 0;
  const optionsList: { value: string; label: string }[] = usesOneOf
    ? currentOneOf.map((opt: any) => ({ value: opt.const || '', label: opt.title || opt.const || '' }))
    : currentEnums.map((val: string, idx: number) => ({ value: val, label: currentEnumNames[idx] || val }));

  return (
    <div className="flex-1 min-w-[280px] border-l border-divider bg-background-content flex flex-col h-full overflow-hidden">
      <div className="px-16 pt-16 pb-8">
        <h3 className="font-semibold text-base m-0">
          {t('builder.inspector_title', 'Egenskaper')}
        </h3>
      </div>

      <div className="flex flex-col overflow-y-auto flex-1 px-16 pb-16">
        {/* --- Grundläggande --- */}
        <div className="flex flex-col gap-12 pb-16">
          <span className="text-small font-semibold text-secondary uppercase tracking-wide">
            {t('builder.section.basic', 'Grundläggande')}
          </span>
          <FormControl className="w-full">
            <FormLabel>{t('builder.properties.name', 'Fältnamn')}</FormLabel>
            <Input
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              onBlur={handleNameBlur}
              className="w-full"
            />
          </FormControl>
          <FormControl className="w-full">
            <FormLabel>{t('builder.properties.label', 'Label')}</FormLabel>
            <Input
              value={localTitle}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full"
            />
          </FormControl>
          <FormControl className="w-full">
            <FormLabel>{t('builder.properties.description', 'Beskrivning')}</FormLabel>
            <Textarea
              value={(fieldSchema as any).description || ''}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              rows={2}
              className="w-full"
            />
          </FormControl>
          <div className="flex gap-16">
            <FormControl className="w-full">
              <Checkbox
                checked={fieldInfo.required}
                onChange={() => onToggleRequired(selectedField)}
              >
                {t('builder.properties.required', 'Obligatorisk')}
              </Checkbox>
            </FormControl>
            <FormControl className="w-full">
              <Checkbox
                checked={isPaired}
                onChange={(e) => handleLayoutChange(e.target.checked)}
              >
                {t('builder.properties.paired', 'Parad (2-kolumn)')}
              </Checkbox>
            </FormControl>
          </div>
        </div>

        <hr className="border-divider my-0" />

        {/* --- Utseende --- */}
        <div className="flex flex-col gap-12 py-16">
          <span className="text-small font-semibold text-secondary uppercase tracking-wide">
            {t('builder.section.appearance', 'Utseende')}
          </span>
          <FormControl className="w-full">
            <FormLabel>{t('builder.properties.widget', 'Widget-typ')}</FormLabel>
            <Select
              value={(fieldUiSchema as any)['ui:widget'] || ''}
              onChange={(e) => handleWidgetChange(e.target.value)}
              className="w-full"
            >
              <Select.Option value="">Standard</Select.Option>
              <Select.Option value="TextWidget">Text</Select.Option>
              <Select.Option value="TextareaWidget">Textarea</Select.Option>
              <Select.Option value="select">Select</Select.Option>
              <Select.Option value="ComboboxWidget">Combobox</Select.Option>
              <Select.Option value="RadiobuttonWidget">Radiobutton</Select.Option>
              <Select.Option value="CheckboxWidget">Checkbox</Select.Option>
              <Select.Option value="date">Datum</Select.Option>
              <Select.Option value="TexteditorWidget">Rich text</Select.Option>
            </Select>
          </FormControl>
          <FormControl className="w-full">
            <FormLabel>{t('builder.properties.placeholder', 'Placeholder')}</FormLabel>
            <Input
              value={(fieldUiSchema as any)['ui:options']?.placeholder || ''}
              onChange={(e) => handlePlaceholderChange(e.target.value)}
              className="w-full"
            />
          </FormControl>
          <FormControl className="w-full">
            <FormLabel>{t('builder.properties.ui_title', 'UI Titel (override)')}</FormLabel>
            <Input
              value={(fieldUiSchema as any)['ui:title'] || ''}
              onChange={(e) => handleUiTitleChange(e.target.value)}
              placeholder={localTitle}
              className="w-full"
            />
          </FormControl>
          <FormControl className="w-full">
            <FormLabel>{t('builder.properties.ui_description', 'UI Beskrivning (override)')}</FormLabel>
            <Textarea
              value={(fieldUiSchema as any)['ui:description'] || ''}
              onChange={(e) => handleUiDescriptionChange(e.target.value)}
              rows={2}
              className="w-full"
            />
          </FormControl>
          <FormControl className="w-full">
            <Checkbox
              checked={(fieldUiSchema as any)['ui:options']?.descriptionBelow || false}
              onChange={(e) => handleDescriptionBelowChange(e.target.checked)}
            >
              {t('builder.properties.description_below', 'Beskrivning under fältet')}
            </Checkbox>
          </FormControl>
        </div>

        {/* --- Alternativ --- */}
        {hasEnum && (
          <>
            <hr className="border-divider my-0" />
            <div className="flex flex-col gap-12 py-16">
              <span className="text-small font-semibold text-secondary uppercase tracking-wide">
                {t('builder.section.options', 'Alternativ')}
              </span>
              <div className="flex flex-col gap-8">
                {optionsList.map((opt, index) => (
                  <div key={index} className="flex gap-8 items-center">
                    <Input
                      value={opt.value}
                      placeholder="Värde"
                      onChange={(e) => {
                        const newOptions = [...optionsList];
                        newOptions[index] = { ...opt, value: e.target.value };
                        if (usesOneOf) {
                          handleOneOfChange(newOptions);
                        } else {
                          handleEnumChange(
                            newOptions.map(o => o.value),
                            newOptions.map(o => o.label)
                          );
                        }
                      }}
                      className="flex-1"
                    />
                    <Input
                      value={opt.label}
                      placeholder="Label"
                      onChange={(e) => {
                        const newOptions = [...optionsList];
                        newOptions[index] = { ...opt, label: e.target.value };
                        if (usesOneOf) {
                          handleOneOfChange(newOptions);
                        } else {
                          handleEnumChange(
                            newOptions.map(o => o.value),
                            newOptions.map(o => o.label)
                          );
                        }
                      }}
                      className="flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newOptions = optionsList.filter((_, i) => i !== index);
                        if (usesOneOf) {
                          handleOneOfChange(newOptions);
                        } else {
                          handleEnumChange(
                            newOptions.map(o => o.value),
                            newOptions.map(o => o.label)
                          );
                        }
                      }}
                      className="px-8 py-4 text-error hover:bg-error hover:bg-opacity-10 rounded"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const newValue = `option${optionsList.length + 1}`;
                    const newLabel = `Alternativ ${optionsList.length + 1}`;
                    const newOptions = [...optionsList, { value: newValue, label: newLabel }];
                    if (usesOneOf) {
                      handleOneOfChange(newOptions);
                    } else {
                      handleEnumChange(
                        newOptions.map(o => o.value),
                        newOptions.map(o => o.label)
                      );
                    }
                  }}
                  className="text-sm text-primary hover:underline text-left mt-4"
                >
                  + Lägg till alternativ
                </button>
              </div>
            </div>
          </>
        )}

        {/* --- Villkor --- */}
        <hr className="border-divider my-0" />
        <div className="flex flex-col gap-12 py-16">
          <span className="text-small font-semibold text-secondary uppercase tracking-wide">
            {t('builder.section.conditions', 'Villkor')}
          </span>
          <ConditionSection
            schema={schema}
            selectedField={selectedField}
            onUpdateCondition={onUpdateCondition}
          />
        </div>
      </div>
    </div>
  );
}

export default FieldInspector;
