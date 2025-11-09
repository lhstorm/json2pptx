'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/hooks/useProjects';
import { formatDate } from '@/lib/utils';
import GenerateModal from '@/components/ai/GenerateModal';
import { storage } from '@/lib/storage';

export default function Dashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { projects, loading, createProject, deleteProject: deleteFirestoreProject } = useProjects();
  const [searchQuery, setSearchQuery] = useState('');
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  // Redirect to login if not authenticated
  if (!user && !loading) {
    router.push('/login');
    return null;
  }

  const handleNewProject = async () => {
    if (!user) return;

    const newProject = await createProject({
      title: 'Untitled Presentation',
      description: ''
    });

    router.push(`/editor/${newProject.id}`);
  };

  const handleDeleteProject = async (id: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      await deleteFirestoreProject(id);
    }
  };

  const handleImportJSON = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const jsonString = event.target?.result as string;
            const jsonData = JSON.parse(jsonString);
            const project = await createProject({
              title: jsonData.presentation_metadata?.title || file.name.replace('.json', ''),
              description: `Imported from ${file.name}`,
              jsonData
            });
            router.push(`/editor/${project.id}`);
          } catch (error) {
            alert('Invalid JSON file');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleExportJSON = (project: any) => {
    storage.exportToJson(project);
  };

  const filteredProjects = projects.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">J2P</span>
            </div>
            <span className="text-xl font-bold text-gray-900">JSON2PPTX</span>
          </Link>
          <div className="flex items-center gap-4">
            <nav className="flex space-x-4">
              <Link
                href="/dashboard"
                className="px-4 py-2 text-blue-600 font-semibold border-b-2 border-blue-600"
              >
                Dashboard
              </Link>
              <Link
                href="/templates"
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                Templates
              </Link>
            </nav>
            {user && (
              <button
                onClick={() => logout()}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Presentations</h1>
          <p className="text-gray-600">Create, edit, and manage your presentations</p>
        </div>

        {/* Actions */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => setShowGenerateModal(true)}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
          >
            <span className="text-xl mr-2">✨</span>
            Generate with AI
          </button>
          <button
            onClick={handleNewProject}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            <span className="text-xl mr-2">+</span>
            New Presentation
          </button>
          <button
            onClick={handleImportJSON}
            className="inline-flex items-center px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            <span className="text-xl mr-2">📤</span>
            Import JSON
          </button>
          <Link
            href="/templates"
            className="inline-flex items-center px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            <span className="text-xl mr-2">🎨</span>
            Browse Templates
          </Link>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search presentations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchQuery ? 'No presentations found' : 'No presentations yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery
                ? 'Try a different search term'
                : 'Create your first presentation with AI or browse templates to get started'}
            </p>
            {!searchQuery && (
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setShowGenerateModal(true)}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
                >
                  <span className="text-xl mr-2">✨</span>
                  Generate with AI
                </button>
                <button
                  onClick={handleNewProject}
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Create Manually
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map(project => (
              <div
                key={project.id}
                className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow overflow-hidden"
              >
                {/* Thumbnail */}
                <div className="h-40 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                  <div className="text-6xl">📊</div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
                    {project.title}
                  </h3>
                  {project.description && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {project.description}
                    </p>
                  )}
                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <span>{project.jsonData.slides.length} slides</span>
                    <span className="mx-2">•</span>
                    <span>Updated {formatDate(project.updatedAt)}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      href={`/editor/${project.id}`}
                      className="flex-1 text-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleExportJSON(project)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      title="Export JSON"
                    >
                      📥
                    </button>
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="px-4 py-2 bg-gray-100 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* AI Generate Modal */}
      <GenerateModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
      />
    </div>
  );
}
