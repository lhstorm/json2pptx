'use client';

import { Block, BlockComponentProps } from '@/types/blocks';
import { MoreVertical, Copy, Trash2, GripVertical } from 'lucide-react';
import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface BaseBlockWrapperProps extends BlockComponentProps {
  children: React.ReactNode;
  draggable?: boolean;
}

export default function BaseBlockWrapper({
  block,
  isEditing,
  isSelected,
  onUpdate,
  onDelete,
  onDuplicate,
  children,
  draggable = true,
}: BaseBlockWrapperProps) {
  const [showMenu, setShowMenu] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    backgroundColor: block.style?.backgroundColor,
    color: block.style?.textColor,
    borderColor: block.style?.borderColor,
    borderWidth: block.style?.borderWidth ? `${block.style.borderWidth}px` : undefined,
    borderRadius: block.style?.borderRadius ? `${block.style.borderRadius}px` : undefined,
    padding: block.style?.padding,
    margin: block.style?.margin,
    fontSize: block.style?.fontSize,
    fontWeight: block.style?.fontWeight,
    textAlign: block.style?.textAlign,
    boxShadow: block.style?.shadow,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      } ${isEditing ? 'hover:ring-2 hover:ring-gray-300' : ''}`}
    >
      {/* Drag Handle & Controls */}
      {isEditing && (
        <div className="absolute -left-12 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
          {draggable && (
            <button
              {...attributes}
              {...listeners}
              className="p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 cursor-grab active:cursor-grabbing"
              title="Drag to reorder"
            >
              <GripVertical className="w-4 h-4 text-gray-600" />
            </button>
          )}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 bg-white border border-gray-300 rounded hover:bg-gray-50"
              title="More options"
            >
              <MoreVertical className="w-4 h-4 text-gray-600" />
            </button>

            {showMenu && (
              <div className="absolute left-full ml-2 top-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[150px]">
                <button
                  onClick={() => {
                    onDuplicate();
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Duplicate
                </button>
                <button
                  onClick={() => {
                    onDelete();
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Block Content */}
      <div className="min-h-[40px]">{children}</div>

      {/* Block Type Indicator */}
      {isEditing && isSelected && (
        <div className="absolute -top-6 left-0 text-xs text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">
          {block.type}
        </div>
      )}
    </div>
  );
}
