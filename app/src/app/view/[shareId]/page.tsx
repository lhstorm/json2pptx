'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSharedPresentation, validatePassword } from '@/lib/sharing';
import { Project, SharingSettings } from '@/types/presentation';
import { Slide as VisualSlide } from '@/types/blocks';
import PresentationView from '@/components/present/PresentationView';
import { Lock } from 'lucide-react';

export default function PublicViewPage() {
  const params = useParams();
  const router = useRouter();
  const shareId = params.shareId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [slides, setSlides] = useState<VisualSlide[]>([]);
  const [settings, setSettings] = useState<SharingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  useEffect(() => {
    loadSharedPresentation();
  }, [shareId]);

  const loadSharedPresentation = async () => {
    try {
      const { project: sharedProject, settings: sharedSettings } = await getSharedPresentation(shareId);

      if (!sharedProject || !sharedSettings) {
        alert('Presentation not found or link has expired');
        router.push('/');
        return;
      }

      setSettings(sharedSettings);

      if (sharedSettings.password) {
        setNeedsPassword(true);
        setLoading(false);
        return;
      }

      loadPresentation(sharedProject);
    } catch (error) {
      console.error('Error loading shared presentation:', error);
      alert('Failed to load presentation');
      router.push('/');
    }
  };

  const loadPresentation = (loadedProject: Project) => {
    setProject(loadedProject);

    // Convert to visual slides
    const visualSlides = loadedProject.jsonData.slides.map((slide, index) => ({
      id: `slide-${index}`,
      title: slide.title || slide.content.title || `Slide ${index + 1}`,
      blocks: [],
      backgroundColor: loadedProject.jsonData.presentation_metadata.theme.background_color,
      notes: slide.speaker_notes || '',
    }));

    setSlides(visualSlides);
    setLoading(false);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!settings?.password) return;

    if (validatePassword(password, settings.password)) {
      const { project: sharedProject } = await getSharedPresentation(shareId);
      if (sharedProject) {
        loadPresentation(sharedProject);
        setNeedsPassword(false);
      }
    } else {
      setPasswordError(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading presentation...</div>
      </div>
    );
  }

  if (needsPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Password Required
            </h1>
            <p className="text-gray-600">
              This presentation is password protected
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError(false);
                }}
                placeholder="Enter password"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  passwordError ? 'border-red-500' : 'border-gray-300'
                }`}
                autoFocus
              />
              {passwordError && (
                <p className="text-red-600 text-sm mt-2">
                  Incorrect password. Please try again.
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              View Presentation
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Presentation not found</div>
      </div>
    );
  }

  return (
    <PresentationView
      project={project}
      slides={slides}
      onExit={() => router.push('/')}
    />
  );
}
