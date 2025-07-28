# Technology Stack & Build System

## Frontend Stack
- **React 18+** with functional components and hooks
- **TypeScript** for type safety
- **Modern CSS** or styled-components for styling
- **Axios/fetch** for HTTP requests
- **HTML5 File API** for file handling

## Backend Stack
- **Node.js** with Express.js framework
- **TypeScript** for backend development
- **Multer** for file upload handling
- **pdf-parse** (or similar) for PDF text extraction
- **Google Generative AI SDK** for Gemini 2.5 Flash integration
- **CORS middleware** for cross-origin requests

## Key Dependencies
```json
{
  "frontend": [
    "react",
    "typescript",
    "axios",
    "@types/react"
  ],
  "backend": [
    "express",
    "multer",
    "pdf-parse",
    "@google/generative-ai",
    "cors",
    "typescript"
  ]
}
```

## Development Commands
```bash
# Frontend development
npm start              # Start React dev server
npm run build         # Build for production
npm test              # Run frontend tests

# Backend development
npm run dev           # Start Express server with hot reload
npm run build         # Compile TypeScript
npm test              # Run backend tests

# Full stack development
npm run dev:all       # Run both frontend and backend concurrently
```

## Architecture Principles
- **Stateless design** - no persistent storage, temporary processing only
- **Simple and fast** - prioritize rapid prototyping over complex features
- **Security-first** - file validation, input sanitization, rate limiting
- **Bilingual support** - Portuguese/English language detection and responses

## API Integration
- **Google Gemini 2.5 Flash** for AI responses
- Environment variables for API key management
- Error handling for rate limits and API failures
- Response caching considerations for identical questions

## File Processing
- PDF-only uploads with size limits (10MB max)
- Temporary file storage with automatic cleanup
- Text extraction and validation
- MIME type and file extension validation