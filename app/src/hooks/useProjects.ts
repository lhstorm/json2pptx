'use client';

import { useState, useEffect } from 'react';
import { Project } from '@/types/presentation';
import { firestoreProjects } from '@/lib/firestore';
import { useAuth } from '@/contexts/AuthContext';

export function useProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setProjects([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Subscribe to real-time updates
    const unsubscribe = firestoreProjects.listen(user.uid, (updatedProjects) => {
      setProjects(updatedProjects);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const createProject = async (data: Partial<Project>): Promise<Project> => {
    if (!user) throw new Error('User not authenticated');

    try {
      const newProject = await firestoreProjects.save(user.uid, data);
      return newProject;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
      throw err;
    }
  };

  const updateProject = async (id: string, data: Partial<Project>): Promise<Project> => {
    if (!user) throw new Error('User not authenticated');

    try {
      const updated = await firestoreProjects.save(user.uid, { ...data, id });
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project');
      throw err;
    }
  };

  const deleteProject = async (id: string): Promise<void> => {
    try {
      await firestoreProjects.delete(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project');
      throw err;
    }
  };

  const duplicateProject = async (id: string): Promise<Project> => {
    if (!user) throw new Error('User not authenticated');

    try {
      const duplicated = await firestoreProjects.duplicate(id, user.uid);
      return duplicated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate project');
      throw err;
    }
  };

  return {
    projects,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    duplicateProject,
  };
}
