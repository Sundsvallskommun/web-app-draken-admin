'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
// arrayMove available if needed for reordering
import { RJSFSchema, UiSchema } from '@rjsf/utils';
import { useCallback, useMemo, useState } from 'react';
import { FieldPalette } from './components/field-palette';
import { BuilderCanvas } from './components/builder-canvas';
import { FieldInspector } from './components/field-inspector';
import {
  addField,
  removeField,
  updateFieldSchema,
  updateFieldUiSchema,
  renameField,
  toggleRequired,
  reorderFields,
  generateFieldName,
  getFieldOrder,
  setFieldCondition,
  FieldType,
  FieldCondition,
  FIELD_TYPES,
  FieldTypeConfig,
} from './utils/schema-operations';

interface SchemaBuilderProps {
  schema: RJSFSchema;
  uiSchema: UiSchema;
  onSchemaChange: (schema: RJSFSchema) => void;
  onUiSchemaChange: (uiSchema: UiSchema) => void;
  height?: string;
}

export function SchemaBuilder({
  schema,
  uiSchema,
  onSchemaChange,
  onUiSchemaChange,
  height = '600px',
}: SchemaBuilderProps) {
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (!over) return;

      const activeData = active.data.current;
      const overId = over.id;

      // Handle dropping from palette to canvas
      if (activeData?.type === 'palette-item') {
        const fieldType = activeData.fieldType as FieldType;
        const fieldName = generateFieldName(schema, fieldType);

        // Determine insert index
        let insertIndex: number | undefined;
        if (overId === 'canvas-drop-zone') {
          insertIndex = undefined; // Add at end
        } else {
          // Insert before the field being hovered over
          const fieldOrder = getFieldOrder(schema, uiSchema);
          const overIndex = fieldOrder.indexOf(overId as string);
          if (overIndex !== -1) {
            insertIndex = overIndex;
          }
        }

        const { schema: newSchema, uiSchema: newUiSchema } = addField(
          schema,
          uiSchema,
          fieldName,
          fieldType,
          insertIndex
        );

        onSchemaChange(newSchema);
        onUiSchemaChange(newUiSchema);
        setSelectedField(fieldName);
        return;
      }

      // Handle reordering within canvas
      if (activeData?.type === 'field-block' && overId !== 'canvas-drop-zone') {
        const fieldOrder = getFieldOrder(schema, uiSchema);
        const activeIndex = fieldOrder.indexOf(active.id as string);
        const overIndex = fieldOrder.indexOf(overId as string);

        if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
          const newUiSchema = reorderFields(uiSchema, activeIndex, overIndex);
          onUiSchemaChange(newUiSchema);
        }
      }
    },
    [schema, uiSchema, onSchemaChange, onUiSchemaChange]
  );

  const handleDeleteField = useCallback(
    (fieldName: string) => {
      const { schema: newSchema, uiSchema: newUiSchema } = removeField(schema, uiSchema, fieldName);
      onSchemaChange(newSchema);
      onUiSchemaChange(newUiSchema);
      if (selectedField === fieldName) {
        setSelectedField(null);
      }
    },
    [schema, uiSchema, onSchemaChange, onUiSchemaChange, selectedField]
  );

  const handleUpdateSchema = useCallback(
    (fieldName: string, updates: Record<string, unknown>) => {
      const newSchema = updateFieldSchema(schema, fieldName, updates);
      onSchemaChange(newSchema);
    },
    [schema, onSchemaChange]
  );

  const handleUpdateUiSchema = useCallback(
    (fieldName: string, updates: Record<string, unknown>) => {
      const newUiSchema = updateFieldUiSchema(uiSchema, fieldName, updates);
      onUiSchemaChange(newUiSchema);
    },
    [uiSchema, onUiSchemaChange]
  );

  const handleRenameField = useCallback(
    (oldName: string, newName: string) => {
      const { schema: newSchema, uiSchema: newUiSchema } = renameField(
        schema,
        uiSchema,
        oldName,
        newName
      );
      onSchemaChange(newSchema);
      onUiSchemaChange(newUiSchema);
      if (selectedField === oldName) {
        setSelectedField(newName);
      }
    },
    [schema, uiSchema, onSchemaChange, onUiSchemaChange, selectedField]
  );

  const handleToggleRequired = useCallback(
    (fieldName: string) => {
      const newSchema = toggleRequired(schema, fieldName);
      onSchemaChange(newSchema);
    },
    [schema, onSchemaChange]
  );

  const handleUpdateCondition = useCallback(
    (fieldName: string, condition: FieldCondition | null) => {
      const newSchema = setFieldCondition(schema, fieldName, condition);
      onSchemaChange(newSchema);
    },
    [schema, onSchemaChange]
  );

  // Get the label for the currently dragged item
  const draggedItemLabel = useMemo(() => {
    if (!activeId) return null;
    if (activeId.startsWith('palette-')) {
      const fieldType = activeId.replace('palette-', '');
      const config = FIELD_TYPES.find((ft: FieldTypeConfig) => ft.type === fieldType);
      return config?.label || fieldType;
    }
    // For field blocks, show the field name
    const fieldInfo = schema.properties?.[activeId];
    return (fieldInfo as any)?.title || activeId;
  }, [activeId, schema.properties]);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex border border-divider rounded-lg overflow-hidden" style={{ height }}>
        <FieldPalette />

        <BuilderCanvas
          schema={schema}
          uiSchema={uiSchema}
          selectedField={selectedField}
          onSelectField={setSelectedField}
          onDeleteField={handleDeleteField}
        />

        <FieldInspector
          schema={schema}
          uiSchema={uiSchema}
          selectedField={selectedField}
          onUpdateSchema={handleUpdateSchema}
          onUpdateUiSchema={handleUpdateUiSchema}
          onRenameField={handleRenameField}
          onToggleRequired={handleToggleRequired}
          onUpdateCondition={handleUpdateCondition}
        />
      </div>

      <DragOverlay>
        {activeId && (
          <div className="p-3 rounded-lg border-2 border-primary bg-background-content shadow-lg">
            <span className="text-sm font-medium">{draggedItemLabel}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

export default SchemaBuilder;
