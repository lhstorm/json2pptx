import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  onSnapshot,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from './firebase';
import { Project, PresentationData, Settings, DEFAULT_THEME } from '@/types/presentation';
import { v4 as uuidv4 } from 'uuid';

// Collections
const COLLECTIONS = {
  PROJECTS: 'projects',
  USERS: 'users',
  TEMPLATES: 'templates',
  SHARED_LINKS: 'shared_links',
};

/**
 * Projects
 */
export const firestoreProjects = {
  // Get all projects for a user
  async getAll(userId: string): Promise<Project[]> {
    try {
      const projectsRef = collection(db, COLLECTIONS.PROJECTS);
      const q = query(
        projectsRef,
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Project));
    } catch (error) {
      console.error('Error getting projects:', error);
      return [];
    }
  },

  // Listen to projects in real-time
  listen(userId: string, callback: (projects: Project[]) => void): () => void {
    const projectsRef = collection(db, COLLECTIONS.PROJECTS);
    const q = query(
      projectsRef,
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const projects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Project));
      callback(projects);
    });
  },

  // Get a single project
  async get(projectId: string): Promise<Project | null> {
    try {
      const docRef = doc(db, COLLECTIONS.PROJECTS, projectId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as Project;
      }
      return null;
    } catch (error) {
      console.error('Error getting project:', error);
      return null;
    }
  },

  // Listen to a single project in real-time
  listenToProject(projectId: string, callback: (project: Project | null) => void): () => void {
    const docRef = doc(db, COLLECTIONS.PROJECTS, projectId);

    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        callback({
          id: docSnap.id,
          ...docSnap.data()
        } as Project);
      } else {
        callback(null);
      }
    });
  },

  // Create or update a project
  async save(userId: string, project: Partial<Project>): Promise<Project> {
    const now = Date.now();

    if (project.id) {
      // Update existing
      const docRef = doc(db, COLLECTIONS.PROJECTS, project.id);
      const updateData = {
        ...project,
        updatedAt: now
      };
      await updateDoc(docRef, updateData as any);

      const updated = await this.get(project.id);
      return updated!;
    } else {
      // Create new
      const newProject: Project = {
        id: uuidv4(),
        userId,
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

      const docRef = doc(db, COLLECTIONS.PROJECTS, newProject.id);
      await setDoc(docRef, newProject);

      return newProject;
    }
  },

  // Delete a project
  async delete(projectId: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.PROJECTS, projectId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  },

  // Duplicate a project
  async duplicate(projectId: string, userId: string): Promise<Project> {
    const original = await this.get(projectId);
    if (!original) throw new Error('Project not found');

    return this.save(userId, {
      title: `${original.title} (Copy)`,
      description: original.description,
      jsonData: original.jsonData
    });
  }
};

/**
 * User Settings
 */
export const firestoreSettings = {
  async get(userId: string): Promise<Settings> {
    try {
      const docRef = doc(db, COLLECTIONS.USERS, userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data().settings || this.getDefault();
      }
      return this.getDefault();
    } catch (error) {
      console.error('Error getting settings:', error);
      return this.getDefault();
    }
  },

  async save(userId: string, settings: Settings): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.USERS, userId);
      await setDoc(docRef, { settings }, { merge: true });
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  },

  getDefault(): Settings {
    return {
      defaultTheme: DEFAULT_THEME,
      editorMode: 'json',
      autoSave: true
    };
  }
};

/**
 * Templates
 */
export const firestoreTemplates = {
  async getAll(): Promise<any[]> {
    try {
      const templatesRef = collection(db, COLLECTIONS.TEMPLATES);
      const q = query(templatesRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting templates:', error);
      return [];
    }
  },

  async get(templateId: string): Promise<any | null> {
    try {
      const docRef = doc(db, COLLECTIONS.TEMPLATES, templateId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting template:', error);
      return null;
    }
  }
};

/**
 * Shared Links
 */
export const firestoreSharing = {
  async createShareLink(projectId: string, settings: {
    password?: string;
    expiresAt?: number;
    allowComments?: boolean;
  }): Promise<string> {
    const shareId = uuidv4();
    const docRef = doc(db, COLLECTIONS.SHARED_LINKS, shareId);

    await setDoc(docRef, {
      projectId,
      ...settings,
      createdAt: Date.now(),
      views: 0
    });

    return shareId;
  },

  async getByShareId(shareId: string): Promise<any | null> {
    try {
      const docRef = doc(db, COLLECTIONS.SHARED_LINKS, shareId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();

        // Check if expired
        if (data.expiresAt && data.expiresAt < Date.now()) {
          return null;
        }

        // Increment view count
        await updateDoc(docRef, {
          views: (data.views || 0) + 1
        });

        return {
          id: docSnap.id,
          ...data
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting shared link:', error);
      return null;
    }
  },

  async revokeShareLink(shareId: string): Promise<void> {
    const docRef = doc(db, COLLECTIONS.SHARED_LINKS, shareId);
    await deleteDoc(docRef);
  }
};
