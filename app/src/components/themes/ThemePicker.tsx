'use client';

import { useState } from 'react';
import { THEMES, THEME_CATEGORIES, getThemesByCategory, Theme } from '@/lib/themes';
import { ThemeConfig } from '@/types/presentation';
import { Check, Palette } from 'lucide-react';

interface ThemePickerProps {
  currentTheme: ThemeConfig;
  onThemeChange: (theme: ThemeConfig) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function ThemePicker({
  currentTheme,
  onThemeChange,
  isOpen,
  onClose,
}: ThemePickerProps) {
  const [selectedCategory, setSelectedCategory] = useState<Theme['category']>('modern');

  if (!isOpen) return null;

  const themesInCategory = getThemesByCategory(selectedCategory);

  const isCurrentTheme = (theme: Theme) => {
    return (
      theme.primary_color === currentTheme.primary_color &&
      theme.secondary_color === currentTheme.secondary_color
    );
  };

  const handleSelectTheme = (theme: Theme) => {
    onThemeChange({
      primary_color: theme.primary_color,
      secondary_color: theme.secondary_color,
      accent_color: theme.accent_color,
      background_color: theme.background_color,
      text_color: theme.text_color,
      font_family: theme.font_family,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Palette className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Choose Theme</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Category Tabs */}
        <div className="border-b">
          <div className="flex gap-1 p-4 overflow-x-auto">
            {THEME_CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
          <p className="px-4 pb-4 text-sm text-gray-600">
            {THEME_CATEGORIES.find((c) => c.id === selectedCategory)?.description}
          </p>
        </div>

        {/* Theme Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {themesInCategory.map((theme) => (
              <button
                key={theme.id}
                onClick={() => handleSelectTheme(theme)}
                className={`relative group rounded-lg border-2 overflow-hidden transition-all hover:shadow-lg ${
                  isCurrentTheme(theme)
                    ? 'border-blue-600 shadow-lg'
                    : 'border-gray-200 hover:border-blue-400'
                }`}
              >
                {/* Theme Preview */}
                <div className="aspect-video relative" style={{
                  background: `linear-gradient(135deg, ${theme.primary_color} 0%, ${theme.secondary_color} 100%)`
                }}>
                  {/* Color Swatches */}
                  <div className="absolute bottom-2 left-2 flex gap-1">
                    <div
                      className="w-6 h-6 rounded border-2 border-white shadow"
                      style={{ backgroundColor: theme.primary_color }}
                    />
                    <div
                      className="w-6 h-6 rounded border-2 border-white shadow"
                      style={{ backgroundColor: theme.secondary_color }}
                    />
                    <div
                      className="w-6 h-6 rounded border-2 border-white shadow"
                      style={{ backgroundColor: theme.accent_color }}
                    />
                  </div>

                  {/* Selected Check */}
                  {isCurrentTheme(theme) && (
                    <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-1">
                      <Check className="w-4 h-4" />
                    </div>
                  )}

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 bg-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
                      Apply
                    </span>
                  </div>
                </div>

                {/* Theme Info */}
                <div className="p-3 bg-white">
                  <h3 className="font-semibold text-sm text-gray-900">{theme.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{theme.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              {THEMES.length} themes available
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
