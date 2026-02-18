'use client';

import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { RJSFSchema, UiSchema } from '@rjsf/utils';
import { useTranslation } from 'next-i18next';
import { useMemo } from 'react';
import { FieldBlock } from './field-block';
import { getFieldInfo, getFieldOrder } from '../utils/schema-operations';

interface BuilderCanvasProps {
  schema: RJSFSchema;
  uiSchema: UiSchema;
  selectedField: string | null;
  onSelectField: (fieldName: string | null) => void;
  onDeleteField: (fieldName: string) => void;
}

export function BuilderCanvas({
  schema,
  uiSchema,
  selectedField,
  onSelectField,
  onDeleteField,
}: BuilderCanvasProps) {
  const { t } = useTranslation('jsonSchemas');

  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas-drop-zone',
    data: {
      type: 'canvas',
    },
  });

  // Memoize field order to prevent unnecessary re-renders
  const fieldOrder = useMemo(
    () => getFieldOrder(schema, uiSchema),
    [schema, uiSchema]
  );
  const hasFields = fieldOrder.length > 0;

  return (
    <div className="flex-1 p-6 bg-background-color-mixin-1 overflow-y-auto max-w-[60rem]">
      <div
        ref={setNodeRef}
        className={`
          min-h-[400px] rounded-lg border-2 border-dashed p-4
          transition-colors
          ${isOver ? 'border-primary bg-primary bg-opacity-5' : 'border-divider'}
          ${!hasFields ? 'flex items-center justify-center' : ''}
        `}
      >
        {hasFields ? (
          <SortableContext
            items={fieldOrder}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-3">
              {fieldOrder.map((fieldName) => {
                const fieldInfo = getFieldInfo(schema, uiSchema, fieldName);
                return (
                  <FieldBlock
                    key={fieldName}
                    id={fieldName}
                    name={fieldInfo.name}
                    title={fieldInfo.title}
                    fieldType={fieldInfo.fieldType}
                    required={fieldInfo.required}
                    isSelected={selectedField === fieldName}
                    onSelect={() => onSelectField(fieldName)}
                    onDelete={() => onDeleteField(fieldName)}
                  />
                );
              })}
            </div>
          </SortableContext>
        ) : (
          <div className="text-center text-gray-500">
            <div className="text-lg mb-2">
              {t('builder.canvas_empty', 'Dra komponenter hit för att bygga formuläret')}
            </div>
            <div className="text-sm">
              Välj en komponent från paletten till vänster
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BuilderCanvas;
