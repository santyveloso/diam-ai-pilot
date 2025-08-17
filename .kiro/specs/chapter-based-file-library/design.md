# Design Document

## Overview

The chapter-based file library feature transforms the current single-file upload system into a persistent, organized file management system. This design maintains the existing Q&A functionality while adding professional content organization capabilities through a chapter-based structure. The solution uses in-memory storage for the MVP implementation, making it suitable for demonstration purposes while keeping the architecture simple and stateless.

## Architecture

### High-Level Architecture

The feature extends the existing React frontend and Node.js backend architecture with new components for file library management:

```
Frontend (React)
├── FileLibraryPanel (new)
├── FileUploadModal (new) 
├── App.tsx (modified)
└── Existing Q&A components

Backend (Express)
├── FileLibraryService (new)
├── /api/files endpoints (new)
├── Modified /api/ask endpoint
└── Existing PDF processing
```

### Data Flow

1. **File Upload**: Teacher uploads PDF → FileUploadModal → Backend FileLibraryService → In-memory storage
2. **File Selection**: Student selects file → FileLibraryPanel → App state update → Q&A components
3. **Question Processing**: Student asks question → Modified /api/ask with fileId → Existing AI processing

### Storage Strategy

**In-Memory Storage (MVP)**:
- Files stored in backend memory using Map data structure
- Chapter organization maintained in nested Map structure
- Files reset on server restart (acceptable for demo)
- No database dependencies required

## Components and Interfaces

### Frontend Components

#### FileLibraryPanel
**Purpose**: Left sidebar component displaying organized file library
**Location**: `frontend/src/components/FileLibraryPanel.tsx`

```typescript
interface FileLibraryPanelProps {
  selectedFileId: string | null;
  onFileSelect: (fileId: string | null) => void;
  userRole: 'student' | 'teacher';
}

interface FileLibraryState {
  chapters: Chapter[];
  expandedChapters: Set<string>;
  isLoading: boolean;
  error: string | null;
}
```

**Key Features**:
- Expandable chapter sections
- File selection with visual indicators
- Teacher-only file management actions
- Responsive design matching current Moodle-inspired UI

#### FileUploadModal
**Purpose**: Modal dialog for uploading files with chapter assignment
**Location**: `frontend/src/components/FileUploadModal.tsx`

```typescript
interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (file: LibraryFile) => void;
  existingChapters: string[];
}

interface UploadFormData {
  file: File | null;
  chapter: string;
  customChapterName: string;
}
```

**Key Features**:
- File drag-and-drop upload
- Chapter selection dropdown
- New chapter creation
- Upload progress indication
- Validation feedback

### Backend Services

#### FileLibraryService
**Purpose**: Manages file storage, retrieval, and organization
**Location**: `backend/src/services/fileLibraryService.ts`

```typescript
class FileLibraryService {
  private static files: Map<string, LibraryFile> = new Map();
  private static chapters: Map<string, string[]> = new Map();
  
  static async uploadFile(file: Express.Multer.File, chapter: string): Promise<LibraryFile>
  static async getFilesByChapter(): Promise<ChapterFiles[]>
  static async getFileById(fileId: string): Promise<LibraryFile | null>
  static async deleteFile(fileId: string): Promise<boolean>
  static async renameChapter(oldName: string, newName: string): Promise<boolean>
}
```

**Storage Structure**:
- `files` Map: fileId → LibraryFile object
- `chapters` Map: chapterName → fileId[]
- File content stored as processed text for Q&A

## Data Models

### LibraryFile
```typescript
interface LibraryFile {
  id: string;                    // Unique file identifier
  originalName: string;          // Original filename
  chapter: string;               // Chapter assignment
  size: number;                  // File size in bytes
  uploadedAt: Date;             // Upload timestamp
  textContent: string;          // Extracted PDF text
  mimeType: string;             // File MIME type
}
```

### Chapter
```typescript
interface Chapter {
  name: string;                 // Chapter display name
  files: LibraryFile[];        // Files in this chapter
  fileCount: number;           // Number of files
  isExpanded?: boolean;        // UI state for expansion
}
```

### ChapterFiles
```typescript
interface ChapterFiles {
  chapter: string;
  files: LibraryFile[];
}
```

## Error Handling

### File Upload Errors
- **File validation**: Size limits, type validation, duplicate detection
- **Chapter validation**: Name length, special characters, uniqueness
- **Storage errors**: Memory limits, processing failures

### File Selection Errors
- **Missing files**: Handle deleted or corrupted file references
- **Access errors**: Validate file availability before Q&A processing
- **Network errors**: Graceful degradation for API failures

### Error Recovery Strategies
- **Retry mechanisms**: Automatic retry for transient failures
- **Fallback behavior**: Graceful degradation to single-file mode
- **User feedback**: Clear error messages with actionable guidance

## Testing Strategy

### Unit Tests

#### Frontend Components
- **FileLibraryPanel**: File selection, chapter expansion, error states
- **FileUploadModal**: Form validation, file upload, chapter creation
- **Integration**: App state management with new components

#### Backend Services
- **FileLibraryService**: CRUD operations, chapter management, error handling
- **API endpoints**: Request validation, response formatting, error cases

### Integration Tests
- **File upload flow**: End-to-end file upload and organization
- **File selection flow**: File selection to Q&A processing
- **Chapter management**: Create, rename, delete operations

### E2E Tests
- **Teacher workflow**: Upload multiple files, organize by chapters
- **Student workflow**: Browse library, select files, ask questions
- **Cross-user scenarios**: Shared library access and updates

## API Endpoints

### File Library Management

#### POST /api/files/upload
**Purpose**: Upload new file with chapter assignment
```typescript
Request: FormData {
  file: File,
  chapter: string
}
Response: {
  success: boolean,
  file: LibraryFile
}
```

#### GET /api/files/library
**Purpose**: Get all files organized by chapter
```typescript
Response: {
  success: boolean,
  chapters: ChapterFiles[]
}
```

#### GET /api/files/:fileId
**Purpose**: Get specific file details
```typescript
Response: {
  success: boolean,
  file: LibraryFile
}
```

#### DELETE /api/files/:fileId
**Purpose**: Delete file from library
```typescript
Response: {
  success: boolean,
  message: string
}
```

#### PUT /api/files/chapters/:oldName
**Purpose**: Rename chapter
```typescript
Request: {
  newName: string
}
Response: {
  success: boolean,
  message: string
}
```

### Modified Existing Endpoint

#### POST /api/ask (Modified)
**Purpose**: Process questions using selected library file
```typescript
Request: {
  question: string,
  fileId: string  // New: reference to library file
}
Response: {
  success: boolean,
  response: string,
  fileUsed: string  // New: confirmation of file used
}
```

## Security Considerations

### File Access Control
- **Shared library**: All users access same file library (appropriate for course context)
- **Upload permissions**: Only authenticated users can upload files
- **File validation**: Strict PDF validation and size limits maintained

### Data Privacy
- **Temporary storage**: Files stored in memory, cleared on restart
- **No persistent data**: No long-term storage of user content
- **Content sanitization**: PDF text extraction with validation

### Input Validation
- **File uploads**: Size, type, and content validation
- **Chapter names**: Length limits, special character filtering
- **API parameters**: Request validation and sanitization

## Performance Considerations

### Memory Management
- **File size limits**: 10MB per file maintained
- **Total storage limits**: Monitor total memory usage
- **Cleanup strategies**: Periodic cleanup of unused files

### Caching Strategy
- **File content**: Cache processed PDF text for repeated access
- **Chapter structure**: Cache chapter organization for quick retrieval
- **API responses**: Cache file library structure for performance

### Scalability Notes
- **Current scope**: Designed for single course demonstration
- **Future considerations**: Database migration path for production use
- **Resource monitoring**: Memory usage tracking and alerts