import { PromptTemplate } from "@langchain/core/prompts";

export const OUTLINE_PROMPT = PromptTemplate.fromTemplate(`
You are an expert presentation designer. Create a detailed outline for a presentation based on the user's request.

User Request: {userPrompt}
Number of Slides: {numSlides}
Style: {style}

Create a JSON outline with the following structure:
{{
  "title": "Presentation Title",
  "subtitle": "Brief subtitle",
  "slides": [
    {{
      "slideNumber": 1,
      "slideType": "title_slide|section_header|bullet_points|chart_slide|etc",
      "title": "Slide Title",
      "purpose": "What this slide should communicate",
      "keyPoints": ["point 1", "point 2"]
    }}
  ]
}}

Available slide types:
- title_slide: Opening slide with title and subtitle
- section_header: Section divider
- bullet_points: Key points with bullets
- chart_slide: Data visualization (bar, line, pie)
- data_table: Tabular data
- text_image_left/right: Text with supporting image
- content_two_column: Two-column layout
- timeline: Chronological events
- process_flow: Step-by-step process
- quote_slide: Inspirational quote
- team_slide: Team members
- thank_you: Closing slide

Guidelines:
1. Start with a title_slide
2. Use section_header to separate major topics
3. End with thank_you
4. Vary slide types for engagement
5. Include 1-2 chart_slide for data
6. Balance text-heavy and visual slides

Return ONLY the JSON outline, no additional text.
`);

export const SLIDE_CONTENT_PROMPT = PromptTemplate.fromTemplate(`
You are an expert content writer. Generate detailed content for a presentation slide.

Slide Information:
- Type: {slideType}
- Title: {slideTitle}
- Purpose: {slidePurpose}
- Key Points: {keyPoints}
- Overall Topic: {overallTopic}
- Style: {style}

Generate content in the exact JSON format required for this slide type:

{slideTypeFormat}

Guidelines:
1. Be concise but informative
2. Use professional language for "professional" style, casual for "casual"
3. Include actionable insights
4. Make content engaging
5. Ensure all required fields are present
6. For charts, provide realistic sample data
7. For images, suggest descriptive search terms

Return ONLY the JSON content object, no additional text.
`);

export const THEME_SELECTION_PROMPT = PromptTemplate.fromTemplate(`
You are a design expert. Select the best color theme for a presentation.

Presentation Topic: {topic}
Style: {style}
Industry: {industry}

Available Themes:
1. Professional Blue: {{primary: "#3B82F6", secondary: "#8B5CF6", accent: "#10B981"}}
2. Corporate Navy: {{primary: "#1E3A8A", secondary: "#64748B", accent: "#F59E0B"}}
3. Creative Purple: {{primary: "#7C3AED", secondary: "#EC4899", accent: "#F97316"}}
4. Modern Teal: {{primary: "#14B8A6", secondary: "#06B6D4", accent: "#8B5CF6"}}
5. Elegant Black: {{primary: "#1F2937", secondary: "#6B7280", accent: "#EF4444"}}

Select the most appropriate theme and return ONLY the theme object in this format:
{{
  "primary_color": "#HEXCOLOR",
  "secondary_color": "#HEXCOLOR",
  "accent_color": "#HEXCOLOR",
  "background_color": "#FFFFFF",
  "text_color": "#111827",
  "font_family": "Calibri"
}}
`);

export const IMAGE_SUGGESTION_PROMPT = PromptTemplate.fromTemplate(`
Generate Unsplash search queries for presentation slides.

Slide Title: {slideTitle}
Slide Content: {slideContent}
Presentation Topic: {presentationTopic}

Generate 3 specific Unsplash search queries that would find relevant, professional images for this slide.

Return ONLY a JSON array of search queries:
["query1", "query2", "query3"]
`);
