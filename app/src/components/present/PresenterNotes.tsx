'use client';

import { X } from 'lucide-react';

interface PresenterNotesProps {
  notes: string;
  currentSlide: number;
  totalSlides: number;
  onClose: () => void;
}

export default function PresenterNotes({
  notes,
  currentSlide,
  totalSlides,
  onClose,
}: PresenterNotesProps) {
  return (
    <div className="w-96 bg-gray-800 border-l border-gray-700 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <h3 className="text-white font-semibold">Presenter Notes</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Slide Info */}
      <div className="px-4 py-3 border-b border-gray-700">
        <div className="text-sm text-gray-400">
          Slide {currentSlide} of {totalSlides}
        </div>
      </div>

      {/* Notes Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {notes ? (
          <div className="text-gray-300 text-sm whitespace-pre-wrap">{notes}</div>
        ) : (
          <div className="text-gray-500 text-sm italic">
            No notes for this slide
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="px-4 py-3 border-t border-gray-700 bg-gray-900">
        <div className="text-xs text-gray-500">
          <div className="font-semibold text-gray-400 mb-2">Keyboard Shortcuts</div>
          <div className="space-y-1">
            <div>→ / ← : Next / Previous slide</div>
            <div>Home / End : First / Last slide</div>
            <div>F : Toggle fullscreen</div>
            <div>N : Toggle notes</div>
            <div>Esc : Exit presentation</div>
          </div>
        </div>
      </div>
    </div>
  );
}
