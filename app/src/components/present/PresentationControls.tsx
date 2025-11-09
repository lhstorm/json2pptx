'use client';

import { Play, Pause, ChevronLeft, ChevronRight, Maximize, Minimize, X } from 'lucide-react';
import { useState } from 'react';

interface PresentationControlsProps {
  currentSlide: number;
  totalSlides: number;
  isFullscreen: boolean;
  showControls: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onFullscreen: () => void;
  onExit: () => void;
}

export default function PresentationControls({
  currentSlide,
  totalSlides,
  isFullscreen,
  showControls,
  onNext,
  onPrevious,
  onFullscreen,
  onExit,
}: PresentationControlsProps) {
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  return (
    <div
      className={`bg-gray-800 border-t border-gray-700 px-6 py-4 transition-opacity duration-300 ${
        showControls ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="flex items-center justify-between">
        {/* Left Controls */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onPrevious}
            disabled={currentSlide === 0}
            className="p-2 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Previous slide (←)"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            className="p-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
            title={isAutoPlaying ? 'Pause' : 'Auto-advance'}
          >
            {isAutoPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>

          <button
            onClick={onNext}
            disabled={currentSlide === totalSlides - 1}
            className="p-2 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Next slide (→)"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Center - Slide Counter */}
        <div className="flex items-center space-x-2">
          <input
            type="range"
            min="0"
            max={totalSlides - 1}
            value={currentSlide}
            onChange={(e) => {
              // This would need to be handled by parent component
            }}
            className="w-64 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-gray-300 text-sm font-medium min-w-[60px] text-center">
            {currentSlide + 1} / {totalSlides}
          </span>
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onFullscreen}
            className="p-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
            title={isFullscreen ? 'Exit fullscreen (Esc)' : 'Fullscreen (F)'}
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>

          <button
            onClick={onExit}
            className="p-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            title="Exit presentation (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="mt-2 text-xs text-gray-500 text-center">
        <span className="mr-4">←/→ Navigate</span>
        <span className="mr-4">F Fullscreen</span>
        <span className="mr-4">N Notes</span>
        <span>Esc Exit</span>
      </div>
    </div>
  );
}
