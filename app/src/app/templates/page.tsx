'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Template, TEMPLATE_CATEGORIES, getAllTemplates } from '@/lib/templates';
import { storage } from '@/lib/storage';

export default function Templates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    const allTemplates = await getAllTemplates();
    setTemplates(allTemplates);
    setLoading(false);
  };

  const handleUseTemplate = (template: Template) => {
    const newProject = storage.saveProject({
      title: `${template.title} (Copy)`,
      description: template.description,
      jsonData: template.data
    });
    storage.setCurrentProjectId(newProject.id);
    window.location.href = `/editor/${newProject.id}`;
  };

  const filteredTemplates = selectedCategory === 'All'
    ? templates
    : templates.filter(t => t.category === selectedCategory);

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
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              Dashboard
            </Link>
            <Link
              href="/templates"
              className="px-4 py-2 text-blue-600 font-semibold border-b-2 border-blue-600"
            >
              Templates
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Template Gallery</h1>
          <p className="text-gray-600">Find the perfect template for your presentation</p>
        </div>

        {/* Category Filter */}
        <div className="mb-8 flex flex-wrap gap-2">
          {TEMPLATE_CATEGORIES.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        {loading ? (
          <div className="text-center py-16">
            <div className="text-gray-600">Loading templates...</div>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🎨</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No templates found
            </h3>
            <p className="text-gray-600">
              Try selecting a different category
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map(template => (
              <div
                key={template.id}
                className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow overflow-hidden"
              >
                {/* Thumbnail */}
                <div className="h-48 bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 flex items-center justify-center relative">
                  <div className="text-7xl">📊</div>
                  <div className="absolute top-2 right-2">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-xs font-semibold text-gray-700 rounded-full">
                      {template.category}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {template.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {template.description}
                  </p>
                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <span>{template.data.slides.length} slides</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUseTemplate(template)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      Use Template
                    </button>
                    <button
                      onClick={() => {
                        const modal = document.getElementById(`preview-${template.id}`);
                        if (modal) {
                          (modal as HTMLDialogElement).showModal();
                        }
                      }}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Preview
                    </button>
                  </div>
                </div>

                {/* Preview Modal */}
                <dialog
                  id={`preview-${template.id}`}
                  className="rounded-lg p-0 backdrop:bg-black/50 max-w-4xl w-full"
                >
                  <div className="bg-white rounded-lg">
                    <div className="flex items-center justify-between p-4 border-b">
                      <h3 className="text-xl font-bold">{template.title}</h3>
                      <button
                        onClick={(e) => {
                          const dialog = (e.target as HTMLElement).closest('dialog');
                          if (dialog) {
                            (dialog as HTMLDialogElement).close();
                          }
                        }}
                        className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                      >
                        ×
                      </button>
                    </div>
                    <div className="p-6">
                      <p className="text-gray-600 mb-4">{template.description}</p>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold mb-2">Slides ({template.data.slides.length}):</h4>
                        <ul className="space-y-1 text-sm">
                          {template.data.slides.slice(0, 10).map((slide, idx) => (
                            <li key={idx} className="text-gray-700">
                              {idx + 1}. {slide.slide_type} {slide.title ? `- ${slide.title}` : ''}
                            </li>
                          ))}
                          {template.data.slides.length > 10 && (
                            <li className="text-gray-500 italic">
                              ...and {template.data.slides.length - 10} more slides
                            </li>
                          )}
                        </ul>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => handleUseTemplate(template)}
                          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                        >
                          Use This Template
                        </button>
                      </div>
                    </div>
                  </div>
                </dialog>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
