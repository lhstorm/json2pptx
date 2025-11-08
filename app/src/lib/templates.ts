import { PresentationData } from '@/types/presentation';

export interface Template {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail?: string;
  data: PresentationData;
}

export const TEMPLATE_CATEGORIES = [
  'All',
  'Business',
  'Education',
  'Technology',
  'Corporate'
] as const;

// Template metadata
export const TEMPLATES: Omit<Template, 'data'>[] = [
  {
    id: 'test',
    title: 'Complete Showcase',
    description: 'Comprehensive 22-slide showcase of all slide types',
    category: 'Technology'
  },
  {
    id: 'test_corporate',
    title: 'Corporate Presentation',
    description: 'Professional business presentation template',
    category: 'Corporate'
  },
  {
    id: 'test_education',
    title: 'Educational Course',
    description: 'Template for educational content and courses',
    category: 'Education'
  },
  {
    id: 'test_improved_business',
    title: 'Strategic Business',
    description: 'Strategic business presentation template',
    category: 'Business'
  },
  {
    id: 'test_improved_tech',
    title: 'Technology Showcase',
    description: 'Modern technology and product showcase',
    category: 'Technology'
  }
];

export async function loadTemplate(id: string): Promise<Template | null> {
  try {
    const response = await fetch(`/templates/${id}.json`);
    if (!response.ok) return null;
    const data = await response.json();
    const metadata = TEMPLATES.find(t => t.id === id);

    if (!metadata) return null;

    return {
      ...metadata,
      data
    };
  } catch (error) {
    console.error(`Error loading template ${id}:`, error);
    return null;
  }
}

export async function getAllTemplates(): Promise<Template[]> {
  const templates = await Promise.all(
    TEMPLATES.map(t => loadTemplate(t.id))
  );
  return templates.filter((t): t is Template => t !== null);
}
