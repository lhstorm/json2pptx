# JSON2PPTX Web Application - Design & Implementation Plan

## 🎯 Project Overview

Transform the json2pptx CLI tool into a modern web application with an intuitive UI, enabling users to create professional PowerPoint presentations through a visual interface and JSON editing.

---

## 📐 UI/UX Design

### Core Features

#### 1. **Presentation Builder Mode**
- Visual slide-by-slide builder with drag-and-drop functionality
- Real-time preview of each slide
- Form-based editors for each slide type
- Template library with pre-built presentations

#### 2. **JSON Editor Mode**
- Advanced code editor with syntax highlighting
- JSON schema validation in real-time
- Auto-complete for slide types and properties
- Split-view: JSON editor on left, live preview on right

#### 3. **Template Gallery**
- Pre-built templates (Corporate, Education, Tech, Marketing)
- Community-submitted templates
- One-click template import
- Customizable themes and color schemes

#### 4. **Conversion Tools**
- JSON → PPTX: Generate PowerPoint from JSON
- PPTX → JSON: Upload PowerPoint and extract JSON
- Batch conversion support
- Download history and file management

### User Interface Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Header: Logo | Templates | My Projects | Profile           │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Sidebar              Main Canvas              Preview Panel │
│  ┌──────────┐        ┌────────────┐           ┌──────────┐ │
│  │          │        │            │           │          │ │
│  │ Slide    │        │  Active    │           │  Live    │ │
│  │ List     │        │  Slide     │           │  Preview │ │
│  │          │        │  Editor    │           │          │ │
│  │ + Add    │        │            │           │          │ │
│  │   Slide  │        │            │           │          │ │
│  │          │        │            │           │          │ │
│  │ [Slide1] │        │  [Forms/   │           │  [PPTX   │ │
│  │ [Slide2] │        │   JSON     │           │   Render]│ │
│  │ [Slide3] │        │   Editor]  │           │          │ │
│  │   ...    │        │            │           │          │ │
│  │          │        │            │           │          │ │
│  └──────────┘        └────────────┘           └──────────┘ │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│  Footer: Export to PPTX | Save Project | Share              │
└─────────────────────────────────────────────────────────────┘
```

### Key Pages

1. **Landing Page** (`/`)
   - Hero section with demo
   - Feature highlights
   - Quick start templates
   - CTA: "Create Your First Presentation"

2. **Dashboard** (`/dashboard`)
   - Recent projects
   - Quick actions (New, Import, Templates)
   - Usage statistics
   - Saved presentations list

3. **Editor** (`/editor/[projectId]`)
   - Main workspace with sidebar, canvas, preview
   - Toggle between Visual Builder and JSON Editor modes
   - Slide type selector panel
   - Properties panel for active slide

4. **Templates Gallery** (`/templates`)
   - Grid of template cards
   - Filter by category (Business, Education, Tech, etc.)
   - Preview and "Use Template" action
   - User-submitted templates section

5. **Settings** (`/settings`)
   - Account preferences
   - Default theme settings
   - API keys (if applicable)
   - Billing (if premium features)

---

## 🏗️ Technical Architecture

### Frontend Stack

**Framework:** Next.js 14+ (App Router)
- Server-side rendering for better SEO
- API routes for backend integration
- File-based routing
- React Server Components

**Language:** TypeScript
- Type safety throughout the application
- Better developer experience
- Reduced runtime errors

**Styling:** Tailwind CSS + shadcn/ui
- Utility-first CSS framework
- Pre-built accessible components
- Consistent design system
- Dark mode support

**State Management:**
- Zustand (lightweight, simple)
- React Query for server state
- Context API for theme/user preferences

**Editor Components:**
- Monaco Editor (VS Code editor) for JSON editing
- react-beautiful-dnd for drag-and-drop
- Slate.js or TipTap for rich text editing

**Preview Rendering:**
- HTML/CSS slide previews that mimic PowerPoint
- Canvas API for advanced rendering
- Export to PDF preview option

### Backend Stack

**Primary Backend:** Firebase
- **Firestore:** Store user projects, templates, metadata
- **Firebase Auth:** User authentication (Google, Email, GitHub)
- **Cloud Storage:** Store generated PPTX files, uploaded images
- **Cloud Functions (Python):** Conversion engine

**Cloud Functions:**

```
functions/
├── generate-pptx/          # Python function - JSON → PPTX
│   ├── main.py
│   ├── pptx_generator.py   # Port from existing code
│   └── requirements.txt
├── extract-json/           # Python function - PPTX → JSON
│   ├── main.py
│   ├── pptx_reader.py      # Port from existing code
│   └── requirements.txt
└── validate-json/          # Node.js function - Fast validation
    └── index.ts
```

**API Structure:**
```
POST /api/generate-pptx
  - Input: JSON presentation data
  - Output: PPTX file URL (Cloud Storage)

POST /api/extract-json
  - Input: PPTX file upload
  - Output: JSON structure

POST /api/validate-json
  - Input: JSON data
  - Output: Validation errors/success

GET /api/templates
  - Output: List of available templates

GET /api/projects
  - Output: User's saved projects

POST /api/projects
  - Input: Project data
  - Output: Project ID

PUT /api/projects/:id
  - Input: Updated project data
  - Output: Success status

DELETE /api/projects/:id
  - Output: Success status
```

### Hosting & Deployment

**Frontend Hosting:** Vercel
- Automatic deployments from GitHub
- Edge functions for API routes
- Environment variables for Firebase config
- CDN for static assets

**Backend Services:** Firebase
- Cloud Functions for Python conversion logic
- Firestore for data persistence
- Cloud Storage for file management
- Authentication for user management

---

## 📊 Database Schema (Firestore)

### Collections

**users**
```typescript
{
  uid: string (doc ID)
  email: string
  displayName: string
  photoURL: string
  createdAt: timestamp
  updatedAt: timestamp
  settings: {
    defaultTheme: object
    preferredMode: 'visual' | 'json'
  }
}
```

**projects**
```typescript
{
  id: string (doc ID)
  userId: string (indexed)
  title: string
  description: string
  thumbnailUrl: string
  jsonData: object // Full presentation JSON
  createdAt: timestamp
  updatedAt: timestamp
  isPublic: boolean
  tags: string[]
  category: string
  metadata: {
    slideCount: number
    lastExportedAt: timestamp
  }
}
```

**templates**
```typescript
{
  id: string (doc ID)
  title: string
  description: string
  category: string
  thumbnailUrl: string
  previewImages: string[]
  jsonData: object
  authorId: string
  isOfficial: boolean
  downloads: number
  likes: number
  createdAt: timestamp
  tags: string[]
}
```

**exports** (Cloud Storage metadata)
```typescript
{
  id: string (doc ID)
  projectId: string
  userId: string
  fileUrl: string (Cloud Storage URL)
  fileSize: number
  format: 'pptx' | 'pdf'
  createdAt: timestamp
  expiresAt: timestamp // Auto-delete after 7 days
}
```

---

## 🎨 Component Architecture

### Component Hierarchy

```
app/
├── layout.tsx                 # Root layout
├── page.tsx                   # Landing page
├── dashboard/
│   └── page.tsx              # Dashboard
├── editor/
│   └── [id]/
│       └── page.tsx          # Editor page
├── templates/
│   └── page.tsx              # Templates gallery
└── api/
    ├── generate-pptx/
    ├── extract-json/
    └── projects/

components/
├── ui/                        # shadcn/ui components
│   ├── button.tsx
│   ├── input.tsx
│   ├── card.tsx
│   └── ...
├── layout/
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   └── Footer.tsx
├── editor/
│   ├── SlideList.tsx
│   ├── SlideEditor.tsx
│   ├── JsonEditor.tsx
│   ├── PreviewPanel.tsx
│   ├── SlideTypeSelector.tsx
│   └── forms/
│       ├── TitleSlideForm.tsx
│       ├── BulletPointsForm.tsx
│       ├── ChartSlideForm.tsx
│       └── ...
├── templates/
│   ├── TemplateCard.tsx
│   └── TemplatePreview.tsx
└── shared/
    ├── FileUpload.tsx
    ├── ThemePicker.tsx
    └── ExportButton.tsx
```

---

## 🔐 Security & Authentication

### Authentication Flow
1. Firebase Authentication with multiple providers:
   - Google OAuth
   - Email/Password
   - GitHub OAuth

2. Protected routes with middleware
3. Server-side session validation
4. JWT tokens for API requests

### Security Measures
- CORS configuration for API endpoints
- File upload validation (size, type)
- Rate limiting on API endpoints
- Sanitization of user-generated content
- Environment variables for sensitive data
- Firestore security rules for data access

### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    // Projects: users can CRUD their own projects
    match /projects/{projectId} {
      allow read: if resource.data.isPublic == true ||
                     resource.data.userId == request.auth.uid;
      allow create: if request.auth.uid != null &&
                       request.resource.data.userId == request.auth.uid;
      allow update, delete: if resource.data.userId == request.auth.uid;
    }

    // Templates: public read, admin write
    match /templates/{templateId} {
      allow read: if true;
      allow write: if request.auth.token.admin == true;
    }
  }
}
```

---

## 📦 Project Structure

```
json2pptx-web/
├── .next/                     # Next.js build output
├── public/
│   ├── images/
│   ├── templates/
│   └── favicon.ico
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── dashboard/
│   │   ├── editor/
│   │   ├── templates/
│   │   └── api/
│   ├── components/            # React components
│   │   ├── ui/
│   │   ├── layout/
│   │   ├── editor/
│   │   └── templates/
│   ├── lib/                   # Utilities
│   │   ├── firebase.ts
│   │   ├── api-client.ts
│   │   ├── validators.ts
│   │   └── utils.ts
│   ├── hooks/                 # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useProjects.ts
│   │   └── useTemplates.ts
│   ├── stores/                # Zustand stores
│   │   ├── editorStore.ts
│   │   └── userStore.ts
│   ├── types/                 # TypeScript types
│   │   ├── presentation.ts
│   │   ├── slide.ts
│   │   └── user.ts
│   └── styles/
│       └── globals.css
├── functions/                 # Firebase Cloud Functions
│   ├── src/
│   │   ├── generate-pptx/    # Python
│   │   └── extract-json/     # Python
│   └── package.json
├── firebase.json              # Firebase configuration
├── firestore.rules            # Firestore security rules
├── storage.rules              # Cloud Storage rules
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── package.json
├── vercel.json                # Vercel configuration
└── README.md
```

---

## 🚀 Implementation Roadmap

### Phase 1: Project Setup & Core Infrastructure (Week 1-2)

**Tasks:**
1. Initialize Next.js project with TypeScript
2. Set up Tailwind CSS and shadcn/ui
3. Configure Firebase project (Auth, Firestore, Storage, Functions)
4. Create Vercel project and link repository
5. Set up environment variables
6. Implement basic authentication flow
7. Create layout components (Header, Footer, Sidebar)
8. Set up routing structure

**Deliverables:**
- Basic app skeleton with authentication
- Firebase services configured
- Deployment pipeline working

### Phase 2: Editor UI - Visual Builder (Week 3-4)

**Tasks:**
1. Create slide list sidebar component
2. Implement slide type selector
3. Build form components for each slide type:
   - Title Slide Form
   - Bullet Points Form
   - Chart Slide Form
   - Table Form
   - Image/Text Form
4. Implement drag-and-drop for slide reordering
5. Add slide actions (duplicate, delete, move)
6. Create basic HTML/CSS preview renderer

**Deliverables:**
- Functional visual editor
- All 20+ slide types supported
- Basic preview functionality

### Phase 3: JSON Editor Mode (Week 5)

**Tasks:**
1. Integrate Monaco Editor
2. Add JSON schema validation
3. Implement auto-complete for slide types
4. Create split-view layout (editor + preview)
5. Add format/beautify JSON functionality
6. Sync between visual and JSON modes

**Deliverables:**
- JSON editor with validation
- Bi-directional sync with visual mode

### Phase 4: Backend Integration (Week 6-7)

**Tasks:**
1. Port `pptx-generator.py` to Cloud Function
2. Port `pptx-reader.py` to Cloud Function
3. Implement Cloud Storage integration
4. Create API endpoints in Next.js:
   - `/api/generate-pptx`
   - `/api/extract-json`
   - `/api/projects` (CRUD)
5. Set up Firestore data layer
6. Implement file upload/download functionality

**Deliverables:**
- Working JSON → PPTX conversion
- Working PPTX → JSON extraction
- Project persistence in Firestore

### Phase 5: Templates & Theme System (Week 8)

**Tasks:**
1. Create template gallery UI
2. Import existing test templates
3. Build theme picker component
4. Implement template preview modal
5. Add "Use Template" functionality
6. Create custom theme builder

**Deliverables:**
- Template gallery with 5+ templates
- Theme customization system

### Phase 6: Dashboard & Project Management (Week 9)

**Tasks:**
1. Build dashboard UI
2. Implement project cards with thumbnails
3. Add search and filter functionality
4. Create project settings modal
5. Implement sharing functionality (public links)
6. Add export history

**Deliverables:**
- Functional dashboard
- Project management features

### Phase 7: Preview & Export Enhancements (Week 10)

**Tasks:**
1. Improve preview rendering fidelity
2. Add slide-by-slide navigation
3. Implement presentation mode (fullscreen)
4. Add PDF export option
5. Create batch export functionality
6. Optimize image handling and compression

**Deliverables:**
- High-fidelity preview
- Multiple export formats

### Phase 8: Polish & Optimization (Week 11-12)

**Tasks:**
1. Implement loading states and error handling
2. Add toast notifications
3. Optimize bundle size
4. Implement caching strategies
5. Add analytics (optional)
6. Write user documentation
7. Create video tutorials
8. Performance testing and optimization
9. Accessibility audit and fixes
10. Mobile responsive improvements

**Deliverables:**
- Production-ready application
- Documentation and tutorials

### Phase 9: Testing & Deployment (Week 13)

**Tasks:**
1. Unit tests for utility functions
2. Integration tests for API endpoints
3. E2E tests with Playwright
4. Security audit
5. Load testing
6. Production deployment
7. Monitor error tracking setup

**Deliverables:**
- Tested and deployed application
- Monitoring and error tracking

### Phase 10: Post-Launch Features (Future)

**Ideas:**
- Collaboration features (multi-user editing)
- Version history
- Comments and annotations
- AI-powered slide generation
- Presentation analytics
- Integration with Google Slides, Keynote
- Mobile app
- Plugin marketplace

---

## 🛠️ Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend Framework** | Next.js 14+ (App Router) | React framework with SSR |
| **Language** | TypeScript | Type-safe development |
| **Styling** | Tailwind CSS + shadcn/ui | Utility CSS + components |
| **State Management** | Zustand + React Query | Client & server state |
| **Editor** | Monaco Editor | JSON code editing |
| **Authentication** | Firebase Auth | User management |
| **Database** | Firestore | NoSQL database |
| **File Storage** | Cloud Storage | File management |
| **Backend Functions** | Cloud Functions (Python) | Conversion logic |
| **Hosting** | Vercel | Frontend hosting |
| **Version Control** | Git + GitHub | Source control |

---

## 📝 Environment Variables

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin (Server-side)
FIREBASE_SERVICE_ACCOUNT_KEY=

# Vercel
VERCEL_URL=
NEXT_PUBLIC_VERCEL_URL=

# Optional
NEXT_PUBLIC_ANALYTICS_ID=
```

---

## 💰 Cost Estimation (Monthly)

**Firebase Free Tier:**
- Firestore: 1GB storage, 50K reads, 20K writes, 20K deletes
- Cloud Functions: 2M invocations
- Cloud Storage: 5GB storage, 1GB download
- Authentication: Unlimited

**Vercel Free Tier:**
- 100GB bandwidth
- Unlimited sites
- Automatic HTTPS

**Estimated Costs at Scale (1000 users):**
- Firebase: ~$25-50/month
- Vercel: Free (Pro at $20/month for larger scale)
- **Total: ~$25-70/month**

---

## 🎯 Success Metrics

1. **User Engagement:**
   - Daily active users
   - Average session duration
   - Presentations created per user

2. **Technical Performance:**
   - Page load time < 2s
   - Conversion time < 10s
   - 99.9% uptime

3. **User Satisfaction:**
   - User feedback/ratings
   - Feature adoption rates
   - Support ticket volume

---

## 🔄 Alternative Approaches Considered

### Option 1: Full TypeScript (Rejected)
**Pros:** Single language, easier maintenance
**Cons:** No suitable PPTX library in TypeScript, would require building from scratch

### Option 2: Separate Python Backend Server (Rejected)
**Pros:** Direct use of existing code
**Cons:** Additional infrastructure, higher costs, more complexity

### Option 3: Client-side Conversion (Rejected)
**Pros:** No server costs, instant conversion
**Cons:** Browser limitations, security concerns, limited PPTX capabilities

### **Selected: Hybrid Approach (Python Cloud Functions + Next.js)**
**Pros:**
- Leverage existing Python code
- Serverless, scales automatically
- Cost-effective
- Best of both worlds

**Cons:**
- Two languages in codebase
- Cold start latency for functions

---

## 📚 Documentation Plan

1. **User Documentation:**
   - Getting started guide
   - Video tutorials for each feature
   - Slide type reference
   - Theme customization guide
   - FAQ

2. **Developer Documentation:**
   - Setup instructions
   - Architecture overview
   - API reference
   - Contributing guidelines
   - Deployment guide

3. **API Documentation:**
   - Endpoint specifications
   - Request/response examples
   - Error codes
   - Rate limits

---

## ✅ Pre-Development Checklist

- [ ] Review and approve design plan
- [ ] Confirm Firebase project setup
- [ ] Confirm Vercel account setup
- [ ] Verify access to GitHub repository
- [ ] Approve UI/UX mockups
- [ ] Set up development environment
- [ ] Install required dependencies
- [ ] Configure environment variables
- [ ] Create Firebase service account
- [ ] Set up Firestore security rules
- [ ] Initialize version control

---

## 🤔 Open Questions for Discussion

1. **Monetization:** Free tier limits? Premium features?
2. **Collaboration:** Should we support multi-user editing in MVP?
3. **Branding:** Logo, color scheme, domain name?
4. **Analytics:** What user data should we track?
5. **Mobile:** Priority for mobile responsive design?
6. **Internationalization:** Support multiple languages?
7. **AI Features:** Should we integrate AI for content generation?

---

## 📞 Next Steps

1. **Review this plan** and provide feedback
2. **Answer open questions** above
3. **Approve to proceed** with implementation
4. **Start with Phase 1** once approved

---

**Document Version:** 1.0
**Last Updated:** 2025-11-08
**Status:** Awaiting Approval
