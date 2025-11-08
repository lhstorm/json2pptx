'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Editor from '@monaco-editor/react';
import { storage } from '@/lib/storage';
import { Project, PresentationData } from '@/types/presentation';
import { validatePresentation, tryParseJSON } from '@/lib/validation';

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [jsonCode, setJsonCode] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    loadProject();
  }, [projectId]);

  const loadProject = () => {
    const loadedProject = storage.getProject(projectId);
    if (!loadedProject) {
      alert('Project not found');
      router.push('/dashboard');
      return;
    }

    setProject(loadedProject);
    setJsonCode(JSON.stringify(loadedProject.jsonData, null, 2));
  };

  const handleSave = () => {
    if (!project) return;

    const { data, error } = tryParseJSON(jsonCode);
    if (error) {
      alert(`JSON Error: ${error}`);
      return;
    }

    const validation = validatePresentation(data);
    if (!validation.valid) {
      const errorMessages = validation.errors.map(e => `${e.path}: ${e.message}`);
      setValidationErrors(errorMessages);
      alert(`Validation failed:\n${errorMessages.join('\n')}`);
      return;
    }

    setValidationErrors([]);
    const updatedProject = storage.saveProject({
      ...project,
      jsonData: data as PresentationData,
      title: data.presentation_metadata?.title || project.title
    });

    setProject(updatedProject);
    setIsSaving(true);
    setLastSaved(new Date());
    setTimeout(() => setIsSaving(false), 1000);
  };

  const handleExportJSON = () => {
    if (!project) return;
    storage.exportToJson(project);
  };

  const handleGeneratePPTX = async () => {
    if (!project) return;

    // First save
    handleSave();

    try {
      const response = await fetch('/api/generate-pptx', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(project.jsonData),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PPTX');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.title.replace(/\s+/g, '-')}.pptx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error generating PPTX:', error);
      alert('Failed to generate PPTX. The API endpoint may not be available yet. You can export the JSON instead and use the Python script locally.');
    }
  };

  const handleFormatJSON = () => {
    const { data, error } = tryParseJSON(jsonCode);
    if (!error && data) {
      setJsonCode(JSON.stringify(data, null, 2));
    }
  };

  if (!isClient || !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 flex-shrink-0">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
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
                  const updated = { ...project, title: e.target.value };
                  setProject(updated);
                  storage.saveProject(updated);
                }}
                className="bg-transparent text-white text-lg font-semibold outline-none focus:bg-gray-700 px-2 py-1 rounded"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {lastSaved && (
              <span className="text-sm text-gray-400">
                {isSaving ? 'Saving...' : `Saved ${lastSaved.toLocaleTimeString()}`}
              </span>
            )}
            <button
              onClick={handleFormatJSON}
              className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors text-sm"
            >
              Format
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-semibold"
            >
              Save
            </button>
            <button
              onClick={handleExportJSON}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors font-semibold"
            >
              Export JSON
            </button>
            <button
              onClick={handleGeneratePPTX}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors font-semibold"
            >
              Generate PPTX
            </button>
          </div>
        </div>
      </header>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-red-900 border-b border-red-800">
          <div className="container mx-auto px-4 py-3">
            <div className="text-red-200 text-sm">
              <strong>Validation Errors:</strong>
              <ul className="list-disc list-inside mt-1">
                {validationErrors.slice(0, 5).map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
                {validationErrors.length > 5 && (
                  <li>...and {validationErrors.length - 5} more errors</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full">
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

      {/* Status Bar */}
      <div className="bg-gray-800 border-t border-gray-700 px-4 py-2 flex items-center justify-between text-sm text-gray-400 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <span>
            {project.jsonData.slides.length} slide{project.jsonData.slides.length !== 1 ? 's' : ''}
          </span>
          <span>JSON Editor</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>
            {validationErrors.length === 0 ? '✓ Valid JSON' : `⚠ ${validationErrors.length} errors`}
          </span>
        </div>
      </div>
    </div>
  );
}
