'use client';

import { useDraggable } from '@dnd-kit/core';
import {
  Type,
  AlignLeft,
  Hash,
  CheckSquare,
  ChevronDown,
  Search,
  Circle,
  Calendar,
  FileText,
} from 'lucide-react';
import { useTranslation } from 'next-i18next';
import { FieldType, FIELD_TYPES } from '../utils/schema-operations';

const iconMap: Record<string, React.FC<{ size?: number | string; className?: string }>> = {
  Type,
  AlignLeft,
  Hash,
  CheckSquare,
  ChevronDown,
  Search,
  Circle,
  Calendar,
  FileText,
};

interface DraggablePaletteItemProps {
  type: FieldType;
  label: string;
  icon: string;
}

function DraggablePaletteItem({ type, label, icon }: DraggablePaletteItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: {
      type: 'palette-item',
      fieldType: type,
    },
  });

  const IconComponent = iconMap[icon] || Type;

  // Don't apply transform - let DragOverlay handle the visual drag
  // Just reduce opacity when dragging
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`
        flex items-center gap-3 p-3 rounded-lg border border-divider
        bg-background-content cursor-grab active:cursor-grabbing
        hover:border-primary hover:bg-background-color-mixin-1
        transition-colors select-none
        ${isDragging ? 'opacity-50' : ''}
      `}
    >
      <IconComponent size={18} className="text-gray-500" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

export function FieldPalette() {
  const { t } = useTranslation('jsonSchemas');

  return (
    <div className="max-w-120 border-r border-divider bg-background-content p-4 flex flex-col h-full overflow-hidden">
      <h3 className="font-semibold text-base mb-4">
        {t('builder.palette_title', 'Komponenter')}
      </h3>

      <div className="flex flex-col max-w-[10.4rem] gap-2 overflow-y-auto flex-1">
        {FIELD_TYPES.map((fieldType) => (
          <DraggablePaletteItem
            key={fieldType.type}
            type={fieldType.type}
            label={t(`builder.field_types.${fieldType.type}`, fieldType.label)}
            icon={fieldType.icon}
          />
        ))}
      </div>
    </div>
  );
}

export default FieldPalette;
