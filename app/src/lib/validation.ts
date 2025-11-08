import { PresentationData } from '@/types/presentation';

export interface ValidationError {
  path: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export function validatePresentation(data: any): ValidationResult {
  const errors: ValidationError[] = [];

  // Check if data is an object
  if (typeof data !== 'object' || data === null) {
    return {
      valid: false,
      errors: [{ path: 'root', message: 'Data must be an object' }]
    };
  }

  // Validate presentation_metadata
  if (!data.presentation_metadata) {
    errors.push({ path: 'presentation_metadata', message: 'Missing presentation_metadata' });
  } else {
    const metadata = data.presentation_metadata;
    if (!metadata.title) {
      errors.push({ path: 'presentation_metadata.title', message: 'Missing title' });
    }
    if (!metadata.author) {
      errors.push({ path: 'presentation_metadata.author', message: 'Missing author' });
    }
    if (!metadata.date) {
      errors.push({ path: 'presentation_metadata.date', message: 'Missing date' });
    }
    if (!metadata.theme) {
      errors.push({ path: 'presentation_metadata.theme', message: 'Missing theme' });
    }
  }

  // Validate slides
  if (!data.slides) {
    errors.push({ path: 'slides', message: 'Missing slides array' });
  } else if (!Array.isArray(data.slides)) {
    errors.push({ path: 'slides', message: 'Slides must be an array' });
  } else {
    data.slides.forEach((slide: any, index: number) => {
      if (!slide.slide_type) {
        errors.push({
          path: `slides[${index}].slide_type`,
          message: 'Missing slide_type'
        });
      }

      // Check for title field (required for all slides except title_slide)
      if (slide.slide_type !== 'title_slide' && slide.slide_type !== 'section_header' &&
          slide.slide_type !== 'quote_slide' && slide.slide_type !== 'thank_you' &&
          slide.slide_type !== 'contact_slide' && !slide.title) {
        errors.push({
          path: `slides[${index}].title`,
          message: `Slide type "${slide.slide_type}" requires a title field`
        });
      }

      if (!slide.content) {
        errors.push({
          path: `slides[${index}].content`,
          message: 'Missing content'
        });
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function tryParseJSON(jsonString: string): { data: any | null; error: string | null } {
  try {
    const data = JSON.parse(jsonString);
    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Invalid JSON'
    };
  }
}
