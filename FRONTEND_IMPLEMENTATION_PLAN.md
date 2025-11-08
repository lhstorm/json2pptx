# Frontend Implementation Plan - Simplified MVP

## 🎯 Objective

Build a pragmatic, working frontend for JSON2PPTX that:
- Works immediately without complex backend setup
- Uses local browser storage (no Firebase for now)
- Provides core editing and conversion features
- Can be enhanced with Firebase later

---

## 📁 Project Structure

```
json2pptx/
├── pptx-generator.py          # Existing (keep as-is)
├── pptx-reader.py             # Existing (keep as-is)
├── requirements.txt           # Existing (keep as-is)
├── tests/                     # Existing (keep as-is)
├── DESIGN_PLAN.md            # Existing
├── UI_WIREFRAMES.md          # Existing
└── app/                      # NEW: Next.js application
    ├── public/
    │   ├── templates/        # JSON template files
    │   └── images/
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx
    │   │   ├── page.tsx             # Landing page
    │   │   ├── dashboard/
    │   │   │   └── page.tsx         # Dashboard
    │   │   ├── editor/
    │   │   │   └── [id]/
    │   │   │       └── page.tsx     # Editor
    │   │   ├── templates/
    │   │   │   └── page.tsx         # Templates gallery
    │   │   └── api/
    │   │       └── generate-pptx/
    │   │           └── route.ts     # PPTX generation endpoint
    │   ├── components/
    │   │   ├── ui/                  # shadcn/ui components
    │   │   ├── layout/
    │   │   │   ├── Header.tsx
    │   │   │   ├── Footer.tsx
    │   │   │   └── Sidebar.tsx
    │   │   ├── editor/
    │   │   │   ├── SlideList.tsx
    │   │   │   ├── SlideEditor.tsx
    │   │   │   ├── JsonEditor.tsx
    │   │   │   ├── PreviewPanel.tsx
    │   │   │   └── forms/
    │   │   │       ├── TitleSlideForm.tsx
    │   │   │       ├── BulletPointsForm.tsx
    │   │   │       └── ChartSlideForm.tsx
    │   │   ├── dashboard/
    │   │   │   └── ProjectCard.tsx
    │   │   └── templates/
    │   │       └── TemplateCard.tsx
    │   ├── lib/
    │   │   ├── storage.ts           # localStorage wrapper
    │   │   ├── templates.ts         # Template utilities
    │   │   ├── validation.ts        # JSON validation
    │   │   └── utils.ts             # General utilities
    │   ├── types/
    │   │   ├── presentation.ts
    │   │   └── slide.ts
    │   └── styles/
    │       └── globals.css
    ├── package.json
    ├── tsconfig.json
    ├── tailwind.config.ts
    ├── next.config.js
    └── vercel.json
```

---

## 💾 Data Storage Strategy (LocalStorage)

### Storage Keys
```typescript
// localStorage keys
const STORAGE_KEYS = {
  PROJECTS: 'json2pptx_projects',      // Array of all projects
  CURRENT_PROJECT: 'json2pptx_current', // ID of active project
  SETTINGS: 'json2pptx_settings'        // User preferences
}
```

### Data Models

**Project (stored in localStorage)**
```typescript
interface Project {
  id: string;                    // UUID
  title: string;
  description?: string;
  jsonData: PresentationData;    // Full JSON structure
  createdAt: number;             // timestamp
  updatedAt: number;             // timestamp
  thumbnail?: string;            // base64 image (optional)
}
```

**PresentationData (matches existing JSON structure)**
```typescript
interface PresentationData {
  presentation_metadata: {
    title: string;
    author: string;
    date: string;
    theme: ThemeConfig;
  };
  slides: Slide[];
}
```

**Settings**
```typescript
interface Settings {
  defaultTheme: ThemeConfig;
  editorMode: 'visual' | 'json';  // Preferred mode
  autoSave: boolean;
}
```

### Storage Operations

```typescript
// lib/storage.ts will provide:
- getAllProjects(): Project[]
- getProject(id: string): Project | null
- saveProject(project: Project): void
- deleteProject(id: string): void
- exportToJson(project: Project): void
- importFromJson(jsonString: string): Project
```

---

## 🔌 API Routes (Vercel Serverless Functions)

### 1. POST /api/generate-pptx

**Purpose:** Convert JSON to PPTX file

**Implementation Strategy:**
```typescript
// app/api/generate-pptx/route.ts
import { exec } from 'child_process';
import { writeFile, readFile, unlink } from 'fs/promises';
import { promisify } from 'util';

export async function POST(request: Request) {
  // 1. Receive JSON data from request body
  const jsonData = await request.json();

  // 2. Write JSON to temporary file
  const tempJsonPath = `/tmp/${Date.now()}.json`;
  const tempPptxPath = `/tmp/${Date.now()}.pptx`;

  await writeFile(tempJsonPath, JSON.stringify(jsonData));

  // 3. Execute Python script
  const execPromise = promisify(exec);
  await execPromise(
    `python3 pptx-generator.py ${tempJsonPath} ${tempPptxPath}`
  );

  // 4. Read generated PPTX file
  const pptxBuffer = await readFile(tempPptxPath);

  // 5. Clean up temp files
  await unlink(tempJsonPath);
  await unlink(tempPptxPath);

  // 6. Return PPTX file as download
  return new Response(pptxBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'Content-Disposition': `attachment; filename="presentation.pptx"`
    }
  });
}
```

**Alternative (if Python doesn't work in Vercel):**
- Phase 1: Just download JSON, user runs Python locally
- Phase 2: Use Python runtime in separate service (Railway, Render)
- Phase 3: Migrate to Firebase Cloud Functions (as originally planned)

### 2. POST /api/extract-json (Future)

For PPTX → JSON conversion. Similar approach but calls `pptx-reader.py`.

---

## 🔐 No Authentication (For Now)

**Why:**
- Simplified MVP
- All data stored locally in browser
- No user accounts needed
- No credentials to manage

**User Experience:**
- No sign-up required
- Instant access
- Projects persist in browser
- User can export/import JSON for backup

**Future Migration Path:**
When we add Firebase:
1. Add Firebase Auth
2. Migrate localStorage data to Firestore on first login
3. Add sync functionality

---

## 🎨 UI Implementation Approach

### Phase 1: Core Components (shadcn/ui)

Install and configure these components:
```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add select
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add toast
```

### Phase 2: Page Implementation Order

1. **Landing Page** (`app/page.tsx`)
   - Simple hero section
   - Feature highlights
   - CTA to start creating
   - No complex animations initially

2. **Dashboard** (`app/dashboard/page.tsx`)
   - Read projects from localStorage
   - Display project cards
   - Create new project button
   - Import JSON functionality

3. **Editor - JSON Mode** (`app/editor/[id]/page.tsx`)
   - Monaco Editor integration
   - JSON validation
   - Save functionality (auto-save to localStorage)
   - Export to JSON button
   - Generate PPTX button (calls API)

4. **Editor - Visual Mode** (Phase 2)
   - Form-based slide editing
   - Will implement after JSON mode works

5. **Templates Gallery** (`app/templates/page.tsx`)
   - Load templates from `public/templates/`
   - Preview modal
   - "Use Template" creates new project from template

---

## 📦 Dependencies

### Core Dependencies
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.0.0",

    // UI Components
    "@radix-ui/react-dialog": "latest",
    "@radix-ui/react-select": "latest",
    "@radix-ui/react-tabs": "latest",
    "class-variance-authority": "latest",
    "clsx": "latest",
    "tailwind-merge": "latest",

    // Editor
    "@monaco-editor/react": "^4.6.0",

    // Utilities
    "uuid": "^9.0.0",
    "zod": "^3.22.0",
    "date-fns": "^3.0.0",

    // Icons
    "lucide-react": "latest"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/uuid": "^9.0.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0"
  }
}
```

---

## 🚀 Deployment Strategy

### Vercel Configuration

**vercel.json**
```json
{
  "buildCommand": "cd app && npm run build",
  "outputDirectory": "app/.next",
  "installCommand": "cd app && npm install && cd .. && pip install -r requirements.txt",
  "framework": "nextjs",
  "functions": {
    "app/api/**/*.ts": {
      "runtime": "nodejs20.x",
      "maxDuration": 30
    }
  }
}
```

**Environment Variables (None needed for MVP!)**
- No API keys
- No Firebase config
- No authentication secrets

---

## 🎯 Implementation Steps

### Step 1: Initialize Next.js Project
```bash
cd json2pptx
mkdir app
cd app
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir
```

Options:
- ✅ TypeScript
- ✅ Tailwind CSS
- ✅ App Router
- ❌ src directory (we'll use our structure)
- ✅ Import alias (@/*)

### Step 2: Setup shadcn/ui
```bash
npx shadcn-ui@latest init
```

Configure:
- Style: Default
- Base color: Slate
- CSS variables: Yes

### Step 3: Install Additional Dependencies
```bash
npm install @monaco-editor/react uuid zod date-fns lucide-react
npm install -D @types/uuid
```

### Step 4: Create Base Structure
```bash
# Create directory structure
mkdir -p src/{components/{ui,layout,editor,dashboard,templates},lib,types}
mkdir -p public/templates
```

### Step 5: Copy Template Files
```bash
# Copy existing test JSON files as templates
cp ../tests/test_json/*.json public/templates/
```

### Step 6: Implement Core Utilities

**Priority Order:**
1. `lib/storage.ts` - localStorage wrapper
2. `types/presentation.ts` - TypeScript types
3. `lib/validation.ts` - JSON schema validation
4. `lib/templates.ts` - Template loading

### Step 7: Build Pages (In Order)

1. Layout (`app/layout.tsx`)
2. Landing Page (`app/page.tsx`)
3. Dashboard (`app/dashboard/page.tsx`)
4. Editor - JSON Mode (`app/editor/[id]/page.tsx`)
5. Templates Gallery (`app/templates/page.tsx`)

### Step 8: Implement API Route

1. Test Python script execution locally
2. Create `/api/generate-pptx` endpoint
3. Handle file upload/download
4. Error handling

### Step 9: Test Locally
```bash
npm run dev
# Test all features
# Verify localStorage persistence
# Test PPTX generation
```

### Step 10: Deploy to Vercel
```bash
vercel
```

---

## 🧪 Testing Strategy

### Manual Testing Checklist

**Dashboard:**
- [ ] Create new project
- [ ] Projects persist after page reload
- [ ] Delete project
- [ ] Search/filter projects

**Editor:**
- [ ] JSON editing works
- [ ] Syntax highlighting
- [ ] Auto-save to localStorage
- [ ] Validation errors display
- [ ] Export JSON downloads file
- [ ] Generate PPTX calls API successfully

**Templates:**
- [ ] Templates load from public folder
- [ ] Preview shows template content
- [ ] "Use Template" creates new project
- [ ] All existing test templates work

**API:**
- [ ] JSON → PPTX conversion works
- [ ] Generated PPTX opens in PowerPoint
- [ ] Error handling for invalid JSON

---

## 🔄 Migration Path to Firebase (Future)

When ready to add Firebase:

1. **Keep localStorage as fallback**
   ```typescript
   // Check if user is authenticated
   if (user) {
     // Use Firestore
     await saveToFirestore(project);
   } else {
     // Use localStorage
     saveToLocalStorage(project);
   }
   ```

2. **Add sync functionality**
   - On first login, offer to sync localStorage projects to cloud
   - Keep both in sync going forward

3. **Gradual migration**
   - Backend still works without Firebase
   - Users can choose local-only mode

---

## ⚠️ Potential Issues & Solutions

### Issue 1: Python in Vercel
**Problem:** Vercel serverless functions may not support Python execution

**Solutions:**
1. **Try Python Runtime:** Vercel supports Python runtime for API routes
2. **Fallback:** Just provide JSON download, user runs Python locally
3. **External Service:** Use Railway/Render for Python API
4. **Future:** Migrate to Firebase Cloud Functions (original plan)

### Issue 2: Large localStorage
**Problem:** Browser localStorage has ~5-10MB limit

**Solutions:**
1. Show warning when approaching limit
2. Suggest exporting old projects
3. Implement automatic cleanup of old projects
4. This motivates migration to Firebase later

### Issue 3: No Collaboration
**Problem:** Each browser has its own projects

**Solutions:**
1. Export/Import JSON for sharing
2. Document this limitation
3. Add Firebase sync in Phase 2

---

## 📊 Success Metrics for MVP

- [ ] User can create a presentation in <5 minutes
- [ ] JSON editor works smoothly with validation
- [ ] PPTX generation works (or graceful fallback)
- [ ] All 20+ slide types are editable
- [ ] Projects persist across sessions
- [ ] App loads in <2 seconds
- [ ] Mobile responsive (basic support)
- [ ] Successfully deployed to Vercel

---

## 🎨 Simplified UI Decisions

**What to Build Now:**
- ✅ Clean, functional UI
- ✅ JSON editor with Monaco
- ✅ Basic form inputs for slide editing
- ✅ Template gallery
- ✅ Project management

**What to Skip for MVP:**
- ❌ Drag-and-drop slide reordering (use up/down buttons)
- ❌ Complex animations
- ❌ Advanced theme customization (use presets)
- ❌ Rich text editor (use textarea)
- ❌ Image upload (use URLs only)
- ❌ Collaboration features
- ❌ User accounts

**Rationale:** Get working product fast, add polish later

---

## 📝 File Organization Logic

### Templates
- Store in `public/templates/*.json`
- Load at runtime from this directory
- No database needed

### Projects
- Store in browser localStorage
- Key format: `json2pptx_projects`
- Value: JSON array of all projects

### Temporary Files (API)
- Use `/tmp` directory in Vercel
- Generate unique filenames with timestamp
- Clean up after response sent

### Static Assets
- Images in `public/images/`
- No CDN needed initially
- Vercel serves static files

---

## 🚦 Implementation Timeline

**Week 1: Foundation**
- Days 1-2: Next.js setup, shadcn/ui configuration
- Days 3-4: localStorage utilities, TypeScript types
- Days 5-7: Landing page, Dashboard

**Week 2: Core Editor**
- Days 1-3: JSON editor with Monaco
- Days 4-5: API route for PPTX generation
- Days 6-7: Templates gallery

**Week 3: Polish & Deploy**
- Days 1-3: Bug fixes, responsive design
- Days 4-5: Testing, documentation
- Days 6-7: Vercel deployment, final testing

---

## ✅ Definition of Done

MVP is complete when:

1. **Functional Requirements:**
   - [x] User can create/edit/delete projects
   - [x] JSON editor works with validation
   - [x] Can generate PPTX from JSON (or export JSON)
   - [x] Templates can be loaded and used
   - [x] Projects persist in localStorage

2. **Technical Requirements:**
   - [x] TypeScript with no errors
   - [x] Responsive design (desktop + tablet)
   - [x] Works in Chrome, Firefox, Safari
   - [x] Deployed to Vercel successfully
   - [x] No console errors

3. **User Experience:**
   - [x] Intuitive navigation
   - [x] Clear error messages
   - [x] Loading states
   - [x] Helpful tooltips

---

## 🔄 Next Steps After MVP

1. Add visual slide editor (forms)
2. Implement drag-and-drop
3. Add Firebase authentication
4. Migrate to Firestore
5. Add collaboration features
6. Build mobile app

---

**Ready to implement?** This plan prioritizes:
- ✅ Simplicity over complexity
- ✅ Working features over perfect features
- ✅ Fast iteration over extensive planning
- ✅ Local-first over cloud-first
- ✅ Pragmatic over idealistic
