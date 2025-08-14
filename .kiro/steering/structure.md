# Project Structure & Organization

## Root Directory Layout
```
diam-ai-pilot/
├── frontend/                 # React application
├── backend/                  # Node.js Express server
├── .kiro/                   # Kiro configuration and specs
│   ├── specs/               # Feature specifications
│   └── steering/            # AI assistant guidance rules
├── README.md                # Project overview (Portuguese)
└── package.json             # Root package configuration
```

## Frontend Structure (React)
```
frontend/
├── src/
│   ├── components/          # React components
│   │   ├── App.tsx         # Main application container
│   │   ├── FileUpload.tsx  # PDF upload component (teachers)
│   │   ├── QuestionInput.tsx # Question input form (students)
│   │   └── ResponseDisplay.tsx # AI response display
│   ├── styles/             # Modular CSS architecture
│   │   ├── index.css       # Main CSS entry point
│   │   ├── base/           # Variables, resets, global styles
│   │   ├── components/     # Component-specific styles
│   │   ├── layout/         # Layout and grid systems
│   │   └── utilities/      # Utility classes and animations
│   ├── services/           # API communication
│   │   └── api.ts          # HTTP client for backend
│   ├── types/              # TypeScript type definitions
│   │   └── index.ts        # Shared interfaces
│   ├── utils/              # Helper functions
│   └── index.tsx           # Application entry point
├── public/                 # Static assets
└── package.json           # Frontend dependencies
```

## Backend Structure (Node.js)
```
backend/
├── src/
│   ├── routes/             # Express route handlers
│   │   └── api.ts          # Main API endpoints
│   ├── services/           # Business logic
│   │   ├── pdfProcessor.ts # PDF text extraction
│   │   └── geminiClient.ts # Gemini API integration
│   ├── middleware/         # Express middleware
│   │   ├── cors.ts         # CORS configuration
│   │   └── upload.ts       # File upload handling
│   ├── types/              # TypeScript interfaces
│   │   └── index.ts        # API request/response types
│   └── server.ts           # Express server setup
├── uploads/                # Temporary file storage (auto-cleanup)
└── package.json           # Backend dependencies
```

## Key Files & Conventions

### Component Organization
- **One component per file** with matching filename
- **TypeScript interfaces** defined at component level or in shared types
- **Props interfaces** named with component name + "Props"
- **Functional components** with hooks, no class components

### API Structure
- **RESTful endpoints** under `/api/` prefix
- **Single main endpoint** `/api/ask` for question processing
- **Consistent error responses** with proper HTTP status codes
- **Request validation** for all inputs

### File Naming
- **camelCase** for TypeScript files and variables
- **PascalCase** for React components
- **kebab-case** for CSS classes and HTML attributes
- **UPPER_CASE** for environment variables

### Testing Organization
```
__tests__/                  # Test files
├── components/             # Component tests
├── services/               # Service layer tests
└── integration/            # End-to-end tests
```

## Environment Configuration
- **Development**: Local servers with hot reload
- **Environment variables**: API keys, ports, file limits
- **No database**: Stateless, temporary processing only
- **CORS setup**: Frontend-backend communication

## Security Considerations
- **File validation** at both frontend and backend
- **Input sanitization** for all user inputs
- **Rate limiting** on API endpoints
- **Temporary storage** with automatic cleanup
- **No persistent data** storage for privacy