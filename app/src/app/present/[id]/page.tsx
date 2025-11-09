'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { firestoreProjects } from '@/lib/firestore';
import { Project } from '@/types/presentation';
import PresentationView from '@/components/present/PresentationView';
import { Slide as VisualSlide } from '@/types/blocks';

export default function PresentPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [slides, setSlides] = useState<VisualSlide[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user && !loading) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = firestoreProjects.listenToProject(projectId, (loadedProject) => {
      if (!loadedProject) {
        alert('Presentation not found');
        router.push('/dashboard');
        return;
      }

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
    });

    return () => unsubscribe();
  }, [projectId, user, router]);

  if (loading || !project) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading presentation...</div>
      </div>
    );
  }

  return (
    <PresentationView
      project={project}
      slides={slides}
      onExit={() => router.push(`/editor/${projectId}`)}
    />
  );
}
