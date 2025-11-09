export interface ThemeConfig {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  font_family: string;
}

export interface PresentationMetadata {
  title: string;
  author: string;
  date: string;
  theme: ThemeConfig;
}

export interface Slide {
  slide_number: number;
  slide_type: string;
  title?: string;
  content: any; // Dynamic based on slide type
  speaker_notes?: string;
  transition?: string;
  duration?: number;
}

export interface PresentationData {
  presentation_metadata: PresentationMetadata;
  slides: Slide[];
}

export interface SharingSettings {
  isPublic: boolean;
  shareId?: string;
  password?: string;
  expiresAt?: number;
  allowComments?: boolean;
  allowDownload?: boolean;
}

export interface Project {
  id: string;
  userId?: string;
  title: string;
  description?: string;
  jsonData: PresentationData;
  createdAt: number;
  updatedAt: number;
  thumbnail?: string;
  sharing?: SharingSettings;
}

export interface Settings {
  defaultTheme: ThemeConfig;
  editorMode: 'visual' | 'json';
  autoSave: boolean;
}

export const DEFAULT_THEME: ThemeConfig = {
  primary_color: "#3B82F6",
  secondary_color: "#8B5CF6",
  accent_color: "#10B981",
  background_color: "#FFFFFF",
  text_color: "#111827",
  font_family: "Calibri"
};

export const DEFAULT_METADATA: PresentationMetadata = {
  title: "Untitled Presentation",
  author: "Author",
  date: new Date().toISOString().split('T')[0],
  theme: DEFAULT_THEME
};
