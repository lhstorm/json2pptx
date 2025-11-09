'use client';

import { Code2, Blocks } from 'lucide-react';

interface EditorModeToggleProps {
  mode: 'visual' | 'json';
  onModeChange: (mode: 'visual' | 'json') => void;
}

export default function EditorModeToggle({ mode, onModeChange }: EditorModeToggleProps) {
  return (
    <div className="inline-flex bg-gray-100 rounded-lg p-1">
      <button
        onClick={() => onModeChange('visual')}
        className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
          mode === 'visual'
            ? 'bg-white text-blue-600 shadow'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <Blocks className="w-4 h-4" />
        <span className="font-medium">Visual</span>
      </button>
      <button
        onClick={() => onModeChange('json')}
        className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
          mode === 'json'
            ? 'bg-white text-blue-600 shadow'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <Code2 className="w-4 h-4" />
        <span className="font-medium">JSON</span>
      </button>
    </div>
  );
}
