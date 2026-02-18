'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  GripVertical,
  Trash2,
} from 'lucide-react';
import { FieldType } from '../utils/schema-operations';

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

const fieldTypeToIcon: Record<FieldType, string> = {
  text: 'Type',
  textarea: 'AlignLeft',
  number: 'Hash',
  checkbox: 'CheckSquare',
  select: 'ChevronDown',
  combobox: 'Search',
  radiobutton: 'Circle',
  date: 'Calendar',
  richtext: 'FileText',
};

interface FieldBlockProps {
  id: string;
  name: string;
  title: string;
  fieldType: FieldType;
  required: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export function FieldBlock({
  id,
  name,
  title,
  fieldType,
  required,
  isSelected,
  onSelect,
  onDelete,
}: FieldBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    data: {
      type: 'field-block',
      name,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const iconName = fieldTypeToIcon[fieldType] || 'Type';
  const IconComponent = iconMap[iconName] || Type;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex items-center gap-3 p-4 rounded-lg border-2
        bg-background-content cursor-pointer
        transition-all select-none
        ${isSelected ? 'border-primary ring-2 ring-primary ring-opacity-30' : 'border-divider hover:border-gray-400'}
        ${isDragging ? 'shadow-xl z-50' : ''}
      `}
      onClick={onSelect}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical size={18} className="text-gray-400" />
      </div>

      {/* Icon */}
      <div className="p-2 rounded bg-background-color-mixin-1">
        <IconComponent size={18} className="text-primary" />
      </div>

      {/* Field info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{title}</span>
          {required && (
            <span className="text-xs text-error font-medium">*</span>
          )}
        </div>
        <div className="text-xs text-gray-500 truncate">{name}</div>
      </div>

      {/* Delete button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="p-2 hover:bg-error hover:bg-opacity-10 rounded transition-colors group"
        title="Ta bort fält"
      >
        <Trash2 size={16} className="text-gray-400 group-hover:text-error" />
      </button>
    </div>
  );
}

export default FieldBlock;
