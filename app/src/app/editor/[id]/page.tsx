'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { firestoreProjects } from '@/lib/firestore';
import { Project, PresentationData } from '@/types/presentation';
import { Slide as VisualSlide } from '@/types/blocks';
import { validatePresentation, tryParseJSON } from '@/lib/validation';
import Editor from '@monaco-editor/react';
import BlockEditor from '@/components/editor/BlockEditor';
import EditorModeToggle from '@/components/editor/EditorModeToggle';
import SlideNavigation from '@/components/editor/SlideNavigation';
import ThemePicker from '@/components/themes/ThemePicker';
import ShareModal from '@/components/sharing/ShareModal';
import { Save, Download, Palette, Play, Share2 } from 'lucide-react';

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [visualSlides, setVisualSlides] = useState<VisualSlide[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [editorMode, setEditorMode] = useState<'visual' | 'json'>('visual');
  const [jsonCode, setJsonCode] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user && !loading) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Load project
  useEffect(() => {
    if (!user) return;

    const unsubscribe = firestoreProjects.listenToProject(projectId, (loadedProject) => {
      if (!loadedProject) {
        alert('Project not found');
        router.push('/dashboard');
        return;
      }

      setProject(loadedProject);
      setJsonCode(JSON.stringify(loadedProject.jsonData, null, 2));

      // Convert to visual slides format
      const slides = convertToVisualSlides(loadedProject.jsonData);
      setVisualSlides(slides);

      setLoading(false);
    });

    return () => unsubscribe();
  }, [projectId, user, router]);

  // Convert presentation JSON to visual slides
  const convertToVisualSlides = (data: PresentationData): VisualSlide[] => {
    // For now, create simple slides from the JSON data
    // This is a simplified conversion - real implementation would be more sophisticated
    return data.slides.map((slide, index) => ({
      id: `slide-${index}`,
      title: slide.title || slide.content.title || `Slide ${index + 1}`,
      blocks: [],
      backgroundColor: data.presentation_metadata.theme.background_color,
      notes: slide.speaker_notes || '',
    }));
  };

  // Convert visual slides back to JSON format
  const convertToJSON = (): PresentationData => {
    if (!project) throw new Error('No project loaded');

    // For now, keep the original JSON structure
    // Real implementation would convert visual blocks back to slide JSON
    return {
      ...project.jsonData,
      presentation_metadata: {
        ...project.jsonData.presentation_metadata,
        title: project.title,
      },
    };
  };

  // Save project
  const handleSave = async () => {
    if (!user || !project) return;

    setIsSaving(true);
    setValidationErrors([]);

    try {
      let updatedData: PresentationData;

      if (editorMode === 'json') {
        // Validate JSON
        const { data, error } = tryParseJSON(jsonCode);
        if (error) {
          alert(`JSON Error: ${error}`);
          setIsSaving(false);
          return;
        }

        const validation = validatePresentation(data);
        if (!validation.valid) {
          const errorMessages = validation.errors.map(e => `${e.path}: ${e.message}`);
          setValidationErrors(errorMessages);
          alert(`Validation failed:\n${errorMessages.join('\n')}`);
          setIsSaving(false);
          return;
        }

        updatedData = data;
      } else {
        // Convert visual slides to JSON
        updatedData = convertToJSON();
      }

      await firestoreProjects.save(user.uid, {
        ...project,
        jsonData: updatedData,
        title: updatedData.presentation_metadata.title || project.title,
      });

      setLastSaved(new Date());
    } catch (err) {
      console.error('Error saving:', err);
      alert('Failed to save project');
    } finally {
      setIsSaving(false);
    }
  };

  // Slide management
  const handleAddSlide = () => {
    const newSlide: VisualSlide = {
      id: `slide-${Date.now()}`,
      title: `Slide ${visualSlides.length + 1}`,
      blocks: [],
      backgroundColor: project?.jsonData.presentation_metadata.theme.background_color,
      notes: '',
    };

    setVisualSlides([...visualSlides, newSlide]);
    setCurrentSlideIndex(visualSlides.length);
  };

  const handleDeleteSlide = (index: number) => {
    if (visualSlides.length <= 1) return;

    const updated = visualSlides.filter((_, i) => i !== index);
    setVisualSlides(updated);

    if (currentSlideIndex >= updated.length) {
      setCurrentSlideIndex(updated.length - 1);
    }
  };

  const handleDuplicateSlide = (index: number) => {
    const slideToCopy = visualSlides[index];
    const newSlide = {
      ...slideToCopy,
      id: `slide-${Date.now()}`,
      title: `${slideToCopy.title} (Copy)`,
    };

    const updated = [
      ...visualSlides.slice(0, index + 1),
      newSlide,
      ...visualSlides.slice(index + 1),
    ];

    setVisualSlides(updated);
    setCurrentSlideIndex(index + 1);
  };

  const handleUpdateSlide = (updatedSlide: VisualSlide) => {
    const updated = visualSlides.map((slide) =>
      slide.id === updatedSlide.id ? updatedSlide : slide
    );
    setVisualSlides(updated);
  };

  const handleThemeChange = (newTheme: any) => {
    if (!project) return;

    const updatedData = {
      ...project.jsonData,
      presentation_metadata: {
        ...project.jsonData.presentation_metadata,
        theme: newTheme,
      },
    };

    // Update visual slides with new background
    const updatedSlides = visualSlides.map(slide => ({
      ...slide,
      backgroundColor: newTheme.background_color,
    }));

    setVisualSlides(updatedSlides);
    setProject({
      ...project,
      jsonData: updatedData,
    });

    setShowThemePicker(false);
  };

  const handleExportJSON = () => {
    if (!project) return;

    const dataStr = JSON.stringify(project.jsonData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.title.replace(/\s+/g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading || !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const currentSlide = visualSlides[currentSlideIndex];

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 flex-shrink-0">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard"
              className="text-gray-400 hover:text-white transition-colors"
            >
              ← Back
            </Link>
            <div className="border-l border-gray-700 pl-4">
              <input
                type="text"
                value={project.title}
                onChange={(e) => {
                  setProject({ ...project, title: e.target.value });
                }}
                className="bg-transparent text-white text-lg font-semibold outline-none focus:bg-gray-700 px-2 py-1 rounded"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <EditorModeToggle mode={editorMode} onModeChange={setEditorMode} />

            {lastSaved && (
              <span className="text-sm text-gray-400">
                {isSaving ? 'Saving...' : `Saved ${lastSaved.toLocaleTimeString()}`}
              </span>
            )}

            {editorMode === 'visual' && (
              <button
                onClick={() => setShowThemePicker(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
              >
                <Palette className="w-4 h-4" />
                Theme
              </button>
            )}

            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-semibold"
            >
              <Save className="w-4 h-4" />
              Save
            </button>

            <button
              onClick={handleExportJSON}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors font-semibold"
            >
              <Download className="w-4 h-4" />
              Export
            </button>

            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors font-semibold"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>

            <Link
              href={`/present/${projectId}`}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors font-semibold"
            >
              <Play className="w-4 h-4" />
              Present
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {editorMode === 'visual' ? (
          <>
            {/* Slide Navigation */}
            <div className="w-64 overflow-y-auto">
              <SlideNavigation
                slides={visualSlides}
                currentSlideIndex={currentSlideIndex}
                onSlideSelect={setCurrentSlideIndex}
                onSlideAdd={handleAddSlide}
                onSlideDelete={handleDeleteSlide}
                onSlideDuplicate={handleDuplicateSlide}
              />
            </div>

            {/* Visual Editor */}
            <div className="flex-1 bg-gray-100 overflow-y-auto p-8">
              <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
                {currentSlide && (
                  <BlockEditor
                    slide={currentSlide}
                    onUpdate={handleUpdateSlide}
                    isEditing={true}
                  />
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* JSON Editor */}
            <div className="flex-1 flex flex-col">
              {validationErrors.length > 0 && (
                <div className="bg-red-900 border-b border-red-800 p-4">
                  <div className="text-red-200 text-sm">
                    <strong>Validation Errors:</strong>
                    <ul className="list-disc list-inside mt-1">
                      {validationErrors.slice(0, 5).map((error, idx) => (
                        <li key={idx}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <div className="flex-1">
                <Editor
                  height="100%"
                  defaultLanguage="json"
                  theme="vs-dark"
                  value={jsonCode}
                  onChange={(value) => setJsonCode(value || '')}
                  options={{
                    fontSize: 14,
                    minimap: { enabled: true },
                    scrollBeyondLastLine: false,
                    wordWrap: 'on',
                    formatOnPaste: true,
                    formatOnType: true,
                    automaticLayout: true,
                    tabSize: 2,
                  }}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Theme Picker Modal */}
      {showThemePicker && (
        <ThemePicker
          currentTheme={project.jsonData.presentation_metadata.theme}
          onThemeChange={handleThemeChange}
          isOpen={showThemePicker}
          onClose={() => setShowThemePicker(false)}
        />
      )}

      {/* Share Modal */}
      {user && (
        <ShareModal
          project={project}
          userId={user.uid}
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}
