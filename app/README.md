# JSON2PPTX Web Application

Modern web interface for the JSON2PPTX converter.

## Features

- **Visual Dashboard**: Manage all your presentations in one place
- **JSON Editor**: Monaco-powered editor with syntax highlighting and validation
- **Template Gallery**: Pre-built templates for quick starts
- **Local Storage**: All data stored in browser (no signup required)
- **Export to PPTX**: Generate PowerPoint files instantly
- **Import/Export JSON**: Full backup and restore capability

## Getting Started

### Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── page.tsx           # Landing page
│   ├── dashboard/         # Projects dashboard
│   ├── editor/[id]/       # JSON editor
│   ├── templates/         # Template gallery
│   └── api/               # API routes
├── components/            # React components
├── lib/                   # Utilities
│   ├── storage.ts        # localStorage wrapper
│   ├── templates.ts      # Template loading
│   ├── validation.ts     # JSON validation
│   └── utils.ts          # Helper functions
├── types/                # TypeScript types
└── styles/               # Global styles
```

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Editor**: Monaco Editor (VS Code)
- **Storage**: Browser localStorage
- **Deployment**: Vercel

## API Routes

### POST /api/generate-pptx

Generate PowerPoint from JSON data.

**Request Body**: PresentationData JSON
**Response**: PPTX file download

## Environment Variables

No environment variables required for basic functionality.

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import repository in Vercel
3. Deploy automatically

```bash
vercel
```

### Other Platforms

The app is a standard Next.js application and can be deployed to any platform that supports Node.js.

## Browser Storage

The app uses localStorage to store:
- Projects (presentations)
- User settings
- Current project ID

**Storage Limits**: ~5-10MB depending on browser

**Backup**: Use the Export JSON feature to backup projects

## Python Integration

The `/api/generate-pptx` endpoint requires Python 3 and python-pptx to be available on the server.

If Python is not available in production:
1. Users can export JSON
2. Run `pptx-generator.py` locally
3. Alternative: Deploy Python script to separate service

## Development Notes

- Uses React Server Components where possible
- Client components marked with 'use client'
- All data operations happen client-side
- No authentication required

## Future Enhancements

- Firebase integration for cloud storage
- User authentication
- Collaboration features
- Visual slide editor
- Drag-and-drop interface
- Mobile app

## License

MIT
