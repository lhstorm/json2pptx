import { Project, Settings, DEFAULT_THEME } from '@/types/presentation';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEYS = {
  PROJECTS: 'json2pptx_projects',
  CURRENT_PROJECT: 'json2pptx_current',
  SETTINGS: 'json2pptx_settings'
};

export const storage = {
  // Projects
  getAllProjects(): Project[] {
    if (typeof window === 'undefined') return [];
    try {
      const projects = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      return projects ? JSON.parse(projects) : [];
    } catch (error) {
      console.error('Error loading projects:', error);
      return [];
    }
  },

  getProject(id: string): Project | null {
    const projects = this.getAllProjects();
    return projects.find(p => p.id === id) || null;
  },

  saveProject(project: Partial<Project>): Project {
    const projects = this.getAllProjects();
    const now = Date.now();

    if (project.id) {
      // Update existing
      const index = projects.findIndex(p => p.id === project.id);
      if (index !== -1) {
        projects[index] = {
          ...projects[index],
          ...project,
          updatedAt: now
        };
        localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
        return projects[index];
      }
    }

    // Create new
    const newProject: Project = {
      id: project.id || uuidv4(),
      title: project.title || 'Untitled Presentation',
      description: project.description || '',
      jsonData: project.jsonData || {
        presentation_metadata: {
          title: project.title || 'Untitled Presentation',
          author: 'Author',
          date: new Date().toISOString().split('T')[0],
          theme: DEFAULT_THEME
        },
        slides: []
      },
      createdAt: project.createdAt || now,
      updatedAt: now,
      thumbnail: project.thumbnail
    };

    projects.push(newProject);
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    return newProject;
  },

  deleteProject(id: string): void {
    const projects = this.getAllProjects().filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));

    // Clear current project if it was deleted
    if (this.getCurrentProjectId() === id) {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_PROJECT);
    }
  },

  // Current Project
  getCurrentProjectId(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.CURRENT_PROJECT);
  },

  setCurrentProjectId(id: string): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_PROJECT, id);
  },

  // Settings
  getSettings(): Settings {
    if (typeof window === 'undefined') {
      return {
        defaultTheme: DEFAULT_THEME,
        editorMode: 'json',
        autoSave: true
      };
    }

    try {
      const settings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return settings ? JSON.parse(settings) : {
        defaultTheme: DEFAULT_THEME,
        editorMode: 'json',
        autoSave: true
      };
    } catch (error) {
      console.error('Error loading settings:', error);
      return {
        defaultTheme: DEFAULT_THEME,
        editorMode: 'json',
        autoSave: true
      };
    }
  },

  saveSettings(settings: Settings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  // Export/Import
  exportToJson(project: Project): void {
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
  },

  importFromJson(jsonString: string, title?: string): Project {
    const jsonData = JSON.parse(jsonString);
    return this.saveProject({
      title: title || jsonData.presentation_metadata?.title || 'Imported Presentation',
      jsonData
    });
  },

  // Clear all data
  clearAll(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.PROJECTS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_PROJECT);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  }
};
