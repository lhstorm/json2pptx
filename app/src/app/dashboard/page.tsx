'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { storage } from '@/lib/storage';
import { Project } from '@/types/presentation';
import { formatDate } from '@/lib/utils';

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    loadProjects();
  }, []);

  const loadProjects = () => {
    const allProjects = storage.getAllProjects();
    setProjects(allProjects.sort((a, b) => b.updatedAt - a.updatedAt));
  };

  const handleNewProject = () => {
    const newProject = storage.saveProject({
      title: 'Untitled Presentation',
      description: ''
    });
    storage.setCurrentProjectId(newProject.id);
    window.location.href = `/editor/${newProject.id}`;
  };

  const handleDeleteProject = (id: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      storage.deleteProject(id);
      loadProjects();
    }
  };

  const handleImportJSON = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const jsonString = event.target?.result as string;
            const project = storage.importFromJson(jsonString, file.name.replace('.json', ''));
            loadProjects();
            window.location.href = `/editor/${project.id}`;
          } catch (error) {
            alert('Invalid JSON file');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const filteredProjects = projects.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isClient) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-600">Loading...</div>
    </div>;
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
                : 'Create your first presentation or browse templates to get started'}
            </p>
            {!searchQuery && (
              <button
                onClick={handleNewProject}
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Create Presentation
              </button>
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
                      onClick={() => storage.exportToJson(project)}
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
    </div>
  );
}
