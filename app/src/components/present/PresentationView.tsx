'use client';

import { useState, useEffect, useCallback } from 'react';
import { Project } from '@/types/presentation';
import { Slide as VisualSlide } from '@/types/blocks';
import PresentationControls from './PresentationControls';
import PresenterNotes from './PresenterNotes';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface PresentationViewProps {
  project: Project;
  slides: VisualSlide[];
  onExit: () => void;
}

export default function PresentationView({ project, slides, onExit }: PresentationViewProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const currentSlide = slides[currentSlideIndex];
  const theme = project.jsonData.presentation_metadata.theme;

  // Navigation handlers
  const goToNext = useCallback(() => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  }, [currentSlideIndex, slides.length]);

  const goToPrevious = useCallback(() => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  }, [currentSlideIndex]);

  const goToSlide = useCallback((index: number) => {
    if (index >= 0 && index < slides.length) {
      setCurrentSlideIndex(index);
    }
  }, [slides.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ':
        case 'PageDown':
          e.preventDefault();
          goToNext();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault();
          goToPrevious();
          break;
        case 'Home':
          e.preventDefault();
          goToSlide(0);
          break;
        case 'End':
          e.preventDefault();
          goToSlide(slides.length - 1);
          break;
        case 'Escape':
          if (isFullscreen) {
            toggleFullscreen();
          } else {
            onExit();
          }
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        case 'n':
        case 'N':
          setShowNotes(!showNotes);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlideIndex, isFullscreen, showNotes, goToNext, goToPrevious, goToSlide, slides.length, onExit]);

  // Fullscreen handling
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Auto-hide controls after inactivity
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setShowControls(false), 3000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col bg-gray-900"
      style={{ backgroundColor: theme.background_color }}
    >
      {/* Header */}
      <header
        className={`flex items-center justify-between px-6 py-4 bg-gray-800 border-b border-gray-700 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex items-center space-x-4">
          <button
            onClick={onExit}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
            Exit
          </button>
          <div className="border-l border-gray-700 pl-4">
            <h1 className="text-white font-semibold">{project.title}</h1>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-gray-400 text-sm">
            {currentSlideIndex + 1} / {slides.length}
          </span>
          <button
            onClick={() => setShowNotes(!showNotes)}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              showNotes
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Notes
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Slide Display */}
        <div className="flex-1 flex items-center justify-center p-8 relative">
          {/* Navigation Arrows */}
          {currentSlideIndex > 0 && (
            <button
              onClick={goToPrevious}
              className={`absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/30 hover:bg-black/50 text-white rounded-full transition-all ${
                showControls ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {currentSlideIndex < slides.length - 1 && (
            <button
              onClick={goToNext}
              className={`absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/30 hover:bg-black/50 text-white rounded-full transition-all ${
                showControls ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Slide Content */}
          <div
            className="w-full max-w-6xl aspect-[16/9] bg-white rounded-lg shadow-2xl flex items-center justify-center p-16"
            style={{ backgroundColor: currentSlide.backgroundColor }}
          >
            <div className="text-center">
              <h1
                className="text-6xl font-bold mb-8"
                style={{ color: theme.text_color }}
              >
                {currentSlide.title}
              </h1>
              {currentSlide.blocks.length === 0 && (
                <p className="text-xl text-gray-500">
                  No content in this slide yet
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Presenter Notes */}
        {showNotes && (
          <PresenterNotes
            notes={currentSlide.notes || ''}
            currentSlide={currentSlideIndex + 1}
            totalSlides={slides.length}
            onClose={() => setShowNotes(false)}
          />
        )}
      </div>

      {/* Controls */}
      <PresentationControls
        currentSlide={currentSlideIndex}
        totalSlides={slides.length}
        isFullscreen={isFullscreen}
        showControls={showControls}
        onNext={goToNext}
        onPrevious={goToPrevious}
        onFullscreen={toggleFullscreen}
        onExit={onExit}
      />
    </div>
  );
}
