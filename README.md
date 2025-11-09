# JSON2PPTX - AI-Powered Presentation Platform

A comprehensive presentation creation platform combining a powerful Python toolkit for JSON-to-PowerPoint conversion with a modern web application featuring AI-powered content generation and visual editing.

## 📦 Two-Part Solution

### 1. Python Library (Core Engine)
Bidirectional JSON ↔ PowerPoint conversion toolkit with 20+ slide types

### 2. Web Application (Modern UI)
Next.js-based presentation builder with AI generation, visual block editor, and Firebase backend

---

## 🌐 Web Application

### Live Features (Sprint 1-2 Complete)

**AI-Powered Generation**
- Claude Sonnet 3.5 integration for intelligent content creation
- LangChain agents for multi-stage generation pipeline
- Text-to-presentation with customizable slide count and style
- Automatic theme selection and image suggestions
- Support for 20+ professional slide types

**Visual Block Editor**
- Notion-style block-based editing
- 6 functional block types: Heading, Paragraph, List, Quote, Image, Chart
- Rich text editing with TipTap
- Data visualization with Recharts
- Drag-and-drop infrastructure ready

**Theme System**
- 25+ professional themes across 5 categories
  - Modern (5 themes)
  - Professional (5 themes)
  - Creative (5 themes)
  - Minimal (5 themes)
  - Bold (5 themes)
- One-click theme application
- Visual preview with gradients

**Editor Features**
- Visual/JSON mode toggle
- Real-time Firebase sync
- Slide management (add, delete, duplicate)
- Slide navigation sidebar
- Monaco editor for JSON editing
- Auto-save functionality

**Infrastructure**
- Firebase Authentication (Google OAuth + Email/Password)
- Firestore for project storage
- Cloud Functions for AI generation
- Real-time listeners for live updates
- Next.js 14 with App Router
- TypeScript + Tailwind CSS

### Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- TipTap (rich text)
- Recharts (charts)
- DnD Kit (drag-and-drop)
- Lucide React (icons)

**Backend:**
- Firebase Firestore
- Firebase Authentication
- Firebase Cloud Functions
- Firebase Storage

**AI:**
- Claude Sonnet 3.5 (Anthropic API)
- LangChain for agent orchestration
- Multi-agent architecture

### Getting Started (Web App)

```bash
# Navigate to web app directory
cd app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your Firebase and Anthropic API keys

# Run development server
npm run dev

# Open http://localhost:3000
```

### Web App Structure

```
app/
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── page.tsx             # Landing page
│   │   ├── login/               # Authentication
│   │   ├── dashboard/           # Project dashboard
│   │   ├── editor/[id]/         # Visual + JSON editor
│   │   └── api/                 # API routes
│   ├── components/
│   │   ├── editor/              # Block editor components
│   │   │   ├── BlockEditor.tsx
│   │   │   ├── blocks/          # 6 block types
│   │   │   ├── SlideNavigation.tsx
│   │   │   └── EditorModeToggle.tsx
│   │   ├── themes/
│   │   │   └── ThemePicker.tsx  # Theme selector modal
│   │   └── ai/
│   │       └── GenerateModal.tsx # AI generation interface
│   ├── lib/
│   │   ├── firebase.ts          # Firebase config
│   │   ├── firestore.ts         # Firestore operations
│   │   ├── blockRegistry.ts     # Block definitions
│   │   └── themes/              # 25+ themes
│   ├── contexts/
│   │   └── AuthContext.tsx      # Auth provider
│   └── types/
│       ├── presentation.ts       # Core types
│       └── blocks.ts            # Block system types
├── functions/                    # Firebase Cloud Functions
│   └── src/
│       ├── agents/              # LangChain AI agents
│       ├── prompts/             # AI prompts
│       └── utils/               # Claude client
└── public/
    └── templates/               # Presentation templates
```

### Roadmap

**✅ Sprint 1: AI Generation + Infrastructure** (Complete)
- Firebase integration
- Authentication
- LangChain + Claude agents
- AI presentation generation
- Template system

**✅ Sprint 2: Visual Editor + Rich Content** (Complete)
- Block-based editor architecture
- 6 functional block types
- Theme system with 25+ themes
- Visual/JSON mode toggle
- Slide management

**🚧 Sprint 3: Collaboration + Sharing** (In Progress)
- Real-time collaboration
- Comments & annotations
- Web presentation mode
- Public sharing links
- Privacy settings

**📋 Sprint 4: Polish + Advanced Features** (Planned)
- Analytics dashboard
- Third-party integrations
- Export improvements
- Performance optimization

---

## 🐍 Python Library (Core Engine)

### Features

- **20+ Slide Types**: Title slides, bullet points, charts, tables, images, timelines, and more
- **Professional Styling**: Consistent themes, fonts, colors, and layouts
- **Native Charts**: PowerPoint-native charts (bar, line, pie, area)
- **Bidirectional Conversion**: JSON → PPTX → JSON with high-fidelity round-trip
- **Comprehensive Testing**: Full test suite with round-trip validation
- **LLM Integration**: Optimized prompt template for AI generation

### Quick Start (Python)

```bash
# Install dependencies
pip install -r requirements.txt

# Generate PowerPoint from JSON
python pptx-generator.py input.json output.pptx

# Extract JSON from PowerPoint
python pptx-reader.py input.pptx output.json

# Run tests
python -m pytest tests/ -v
```

### JSON Structure

```json
{
  "presentation_metadata": {
    "title": "Presentation Title",
    "author": "Author Name",
    "date": "2024-01-01",
    "theme": {
      "primary_color": "#2C3E50",
      "secondary_color": "#3498DB",
      "accent_color": "#E74C3C",
      "background_color": "#FFFFFF",
      "text_color": "#212121",
      "font_family": "Calibri"
    }
  },
  "slides": [
    {
      "slide_number": 1,
      "slide_type": "title_slide",
      "content": {
        "title": "Main Title",
        "subtitle": "Subtitle",
        "author": "Author",
        "date": "Date"
      }
    }
  ]
}
```

### Supported Slide Types

1. **title_slide** - Title page with main/subtitle
2. **section_header** - Section divider
3. **bullet_points** - Bulleted lists with multi-level support
4. **chart_slide** - Bar, line, pie, area charts
5. **data_table** - Styled data tables
6. **comparison_table** - Side-by-side comparisons
7. **text_image_left** - Text with left-aligned image
8. **text_image_right** - Text with right-aligned image
9. **content_two_column** - Two-column layouts
10. **content_three_column** - Three-column layouts
11. **timeline** - Event timelines
12. **process_flow** - Step-by-step processes
13. **quote_slide** - Highlighted quotes
14. **icon_points** - Icon-based key points
15. **team_slide** - Team member profiles
16. **contact_slide** - Contact information
17. **thank_you** - Closing slide
18. **blank_slide** - Custom content
19. **big_number** - Large statistics
20. **before_after** - Comparison slides

See full documentation in [Python README](#) for detailed slide specifications.

### Testing

```bash
# Run all tests
python -m pytest tests/ -v

# Test specific functionality
python -m pytest tests/test_simple_roundtrip.py -v

# Quick validation
python run_tests.py
```

**Test Templates:**
- `test.json` - Comprehensive 22-slide showcase
- `test_corporate.json` - Business presentation
- `test_education.json` - Educational content
- `test_improved_business.json` - Strategic business
- `test_improved_tech.json` - Technology showcase

---

## 🤖 AI Integration

The platform uses Claude Sonnet 3.5 via LangChain agents for intelligent presentation generation:

**Multi-Agent Pipeline:**
1. **OutlineAgent** - Creates presentation structure
2. **ThemeAgent** - Selects appropriate theme
3. **SlideContentAgent** - Generates content for each slide
4. **ImageSuggestionAgent** - Suggests relevant images

**Usage:**
```typescript
// In web app
const result = await generatePresentation({
  prompt: "Create a presentation about AI in healthcare",
  slides: 10,
  style: "professional"
});
```

---

## 📊 Current Status

**Lines of Code:** ~15,000+
**Components:** 40+ React components
**Block Types:** 20+ defined (6 implemented)
**Themes:** 25 professional themes
**Slide Types:** 20+ supported
**AI Agents:** 4 specialized agents
**Tests:** Comprehensive Python test suite

**Build Status:** ✅ Passing
**TypeScript:** ✅ No errors
**Firebase:** ✅ Configured
**AI Generation:** ✅ Functional

---

## 🔧 Environment Variables

```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Anthropic AI
ANTHROPIC_API_KEY=

# Optional integrations
UNSPLASH_ACCESS_KEY=
GIPHY_API_KEY=
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure builds pass: `npm run build`
5. Submit a pull request

---

## 📄 License

MIT License - see LICENSE file for details.

---

## 🔗 Links

- **Repository**: https://github.com/lhstorm/json2pptx
- **Issues**: https://github.com/lhstorm/json2pptx/issues
- **Documentation**: See `/docs` folder
- **python-pptx**: https://python-pptx.readthedocs.io/

---

*Build professional presentations with AI-powered generation, visual block editing, and seamless JSON-to-PowerPoint conversion.*
