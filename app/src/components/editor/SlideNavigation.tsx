'use client';

import { Plus, Trash2, Copy } from 'lucide-react';
import { Slide } from '@/types/blocks';

interface SlideNavigationProps {
  slides: Slide[];
  currentSlideIndex: number;
  onSlideSelect: (index: number) => void;
  onSlideAdd: () => void;
  onSlideDelete: (index: number) => void;
  onSlideDuplicate: (index: number) => void;
}

export default function SlideNavigation({
  slides,
  currentSlideIndex,
  onSlideSelect,
  onSlideAdd,
  onSlideDelete,
  onSlideDuplicate,
}: SlideNavigationProps) {
  return (
    <div className="h-full flex flex-col bg-white border-r">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Slides</h3>
          <span className="text-sm text-gray-500">{slides.length}</span>
        </div>
        <button
          onClick={onSlideAdd}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Slide
        </button>
      </div>

      {/* Slide List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            onClick={() => onSlideSelect(index)}
            className={`group relative rounded-lg border-2 overflow-hidden cursor-pointer transition-all ${
              currentSlideIndex === index
                ? 'border-blue-600 shadow-md'
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            {/* Slide Preview */}
            <div
              className="aspect-video p-4 flex items-center justify-center text-center"
              style={{ backgroundColor: slide.backgroundColor || '#FFFFFF' }}
            >
              <div className="text-xs font-medium text-gray-700 line-clamp-3">
                {slide.title || 'Untitled Slide'}
              </div>
            </div>

            {/* Slide Number */}
            <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
              {index + 1}
            </div>

            {/* Slide Actions */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSlideDuplicate(index);
                }}
                className="p-1.5 bg-white rounded shadow hover:bg-gray-50"
                title="Duplicate"
              >
                <Copy className="w-3 h-3 text-gray-700" />
              </button>
              {slides.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Delete this slide?')) {
                      onSlideDelete(index);
                    }
                  }}
                  className="p-1.5 bg-white rounded shadow hover:bg-red-50"
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3 text-red-600" />
                </button>
              )}
            </div>

            {/* Block Count */}
            <div className="px-2 py-1 bg-gray-50 text-xs text-gray-600 text-center">
              {slide.blocks.length} {slide.blocks.length === 1 ? 'block' : 'blocks'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
