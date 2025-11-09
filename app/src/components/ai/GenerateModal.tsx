'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProjects } from '@/hooks/useProjects';

interface GenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GenerateModal({ isOpen, onClose }: GenerateModalProps) {
  const router = useRouter();
  const { createProject } = useProjects();
  const [prompt, setPrompt] = useState('');
  const [numSlides, setNumSlides] = useState(10);
  const [style, setStyle] = useState<'professional' | 'casual' | 'creative'>('professional');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call Firebase Cloud Function
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          numSlides,
          style,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate presentation');
      }

      const data = await response.json();

      // Create project with generated presentation
      const project = await createProject({
        title: data.presentation.presentation_metadata.title,
        description: `AI-generated presentation: ${prompt}`,
        jsonData: data.presentation,
      });

      // Navigate to editor
      router.push(`/editor/${project.id}`);
      onClose();
    } catch (err) {
      console.error('Error generating presentation:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate presentation');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            ✨ Generate Presentation with AI
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* Prompt */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              What's your presentation about?
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Create a presentation about the future of AI in healthcare, focusing on diagnostics, treatment, and patient care"
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <p className="mt-2 text-sm text-gray-500">
              Be specific! The more details you provide, the better the result.
            </p>
          </div>

          {/* Number of Slides */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Number of slides
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="5"
                max="30"
                value={numSlides}
                onChange={(e) => setNumSlides(parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-lg font-semibold text-gray-900 w-12 text-center">
                {numSlides}
              </span>
            </div>
          </div>

          {/* Style */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Style
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['professional', 'casual', 'creative'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStyle(s)}
                  className={`px-4 py-3 rounded-lg border-2 font-medium capitalize transition-colors ${
                    style === s
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  ✨ Generate Presentation
                </>
              )}
            </button>
          </div>
        </div>

        {loading && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm text-center">
              🤖 AI is creating your presentation... This may take 30-60 seconds
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
