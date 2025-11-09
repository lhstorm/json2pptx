import { createClaudeClient } from "../utils/claudeClient";
import {
  OUTLINE_PROMPT,
  SLIDE_CONTENT_PROMPT,
  THEME_SELECTION_PROMPT,
} from "../prompts/generatePresentation";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";

interface GeneratePresentationInput {
  prompt: string;
  numSlides?: number;
  style?: 'professional' | 'casual' | 'creative';
}

interface SlideOutline {
  slideNumber: number;
  slideType: string;
  title: string;
  purpose: string;
  keyPoints: string[];
}

interface PresentationOutline {
  title: string;
  subtitle: string;
  slides: SlideOutline[];
}

// Slide type format templates
const SLIDE_TYPE_FORMATS: Record<string, string> = {
  title_slide: `{
    "title": "Main Title",
    "subtitle": "Subtitle",
    "author": "Author Name",
    "date": "Month Year"
  }`,
  bullet_points: `{
    "title": "Slide Title",
    "points": [
      {"text": "Main point", "level": 1},
      {"text": "Sub-point", "level": 2}
    ]
  }`,
  chart_slide: `{
    "title": "Chart Title",
    "chart_type": "bar|line|pie",
    "data": {
      "labels": ["Label1", "Label2"],
      "datasets": [
        {
          "name": "Dataset Name",
          "values": [100, 200]
        }
      ]
    },
    "options": {
      "show_legend": true,
      "show_grid": true
    }
  }`,
  section_header: `{
    "title": "Section Title",
    "subtitle": "Section description"
  }`,
  text_image_left: `{
    "title": "Slide Title",
    "text": "Descriptive text content",
    "image": "https://picsum.photos/800/600?random=topic"
  }`,
  quote_slide: `{
    "quote": "Inspirational or relevant quote",
    "attribution": "Quote Author"
  }`,
  thank_you: `{
    "title": "Thank You",
    "subtitle": "Questions & Discussion",
    "contact": "email@example.com"
  }`,
};

export class PresentationGeneratorAgent {
  private claudeClient = createClaudeClient(0.7);

  async generatePresentation(input: GeneratePresentationInput) {
    const numSlides = input.numSlides || 10;
    const style = input.style || 'professional';

    console.log(`Generating presentation: "${input.prompt}" with ${numSlides} slides`);

    try {
      // Step 1: Generate outline
      const outline = await this.generateOutline(input.prompt, numSlides, style);
      console.log('Outline generated:', outline.title);

      // Step 2: Generate theme
      const theme = await this.selectTheme(outline.title, style);
      console.log('Theme selected');

      // Step 3: Generate content for each slide
      const slides = await this.generateSlides(outline, input.prompt, style);
      console.log(`Generated ${slides.length} slides`);

      // Step 4: Assemble final presentation
      const presentation = {
        presentation_metadata: {
          title: outline.title,
          author: "AI Generated",
          date: new Date().toISOString().split('T')[0],
          theme,
        },
        slides,
      };

      return presentation;
    } catch (error) {
      console.error('Error generating presentation:', error);
      throw error;
    }
  }

  private async generateOutline(
    userPrompt: string,
    numSlides: number,
    style: string
  ): Promise<PresentationOutline> {
    const chain = RunnableSequence.from([
      OUTLINE_PROMPT,
      this.claudeClient,
      new StringOutputParser(),
    ]);

    const response = await chain.invoke({
      userPrompt,
      numSlides: numSlides.toString(),
      style,
    });

    // Parse JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse outline JSON');
    }

    return JSON.parse(jsonMatch[0]);
  }

  private async selectTheme(topic: string, style: string) {
    const chain = RunnableSequence.from([
      THEME_SELECTION_PROMPT,
      this.claudeClient,
      new StringOutputParser(),
    ]);

    const response = await chain.invoke({
      topic,
      style,
      industry: 'general',
    });

    // Parse JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse theme JSON');
    }

    return JSON.parse(jsonMatch[0]);
  }

  private async generateSlides(
    outline: PresentationOutline,
    overallTopic: string,
    style: string
  ) {
    const slides = [];

    for (const slideOutline of outline.slides) {
      console.log(`Generating slide ${slideOutline.slideNumber}: ${slideOutline.title}`);

      const slideTypeFormat = SLIDE_TYPE_FORMATS[slideOutline.slideType] ||
        SLIDE_TYPE_FORMATS['bullet_points'];

      const chain = RunnableSequence.from([
        SLIDE_CONTENT_PROMPT,
        this.claudeClient,
        new StringOutputParser(),
      ]);

      const response = await chain.invoke({
        slideType: slideOutline.slideType,
        slideTitle: slideOutline.title,
        slidePurpose: slideOutline.purpose,
        keyPoints: slideOutline.keyPoints.join(', '),
        overallTopic,
        style,
        slideTypeFormat,
      });

      // Parse JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error(`Failed to parse slide ${slideOutline.slideNumber}`);
        continue;
      }

      const content = JSON.parse(jsonMatch[0]);

      const slide = {
        slide_number: slideOutline.slideNumber,
        slide_type: slideOutline.slideType,
        ...( slideOutline.slideType !== 'title_slide' &&
             slideOutline.slideType !== 'section_header' &&
             slideOutline.slideType !== 'quote_slide' &&
             slideOutline.slideType !== 'thank_you'
          ? { title: slideOutline.title }
          : {}
        ),
        content,
      };

      slides.push(slide);
    }

    return slides;
  }
}
