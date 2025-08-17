/**
 * Core API Types
 * These types define the structure of API requests and responses
 */

/** Request payload for asking questions about PDF content */
export interface AskRequest {
  /** The question to ask about the PDF content */
  question: string;
  /** The PDF file to analyze (legacy) */
  file?: File;
  /** The file ID from the library to analyze */
  fileId?: string;
}

// Type guard to ensure at least one file source is provided
export type ValidAskRequest = AskRequest & (
  | { file: File; fileId?: never }
  | { file?: never; fileId: string }
);

/** Successful response from the ask endpoint */
export interface AskResponse {
  /** The AI-generated response */
  response: string;
  /** Indicates successful processing */
  success: boolean;
  /** Error message if success is false */
  error?: string;
  /** Confirmation of file used for the response */
  fileUsed?: string;
}

/** Error response structure from API */
export interface ErrorResponse {
  /** Always false for error responses */
  success: false;
  /** Error details */
  error: {
    /** Machine-readable error code */
    code: string;
    /** Human-readable error message */
    message: string;
    /** Additional error details (development only) */
    details?: any;
    /** ISO timestamp of when error occurred */
    timestamp?: string;
    /** Unique request identifier for tracking */
    requestId?: string;
  };
}

/**
 * File Library Types
 * Types for the chapter-based file library system
 */

/** File stored in the library with metadata */
export interface LibraryFile {
  /** Unique file identifier */
  id: string;
  /** Original filename */
  originalName: string;
  /** Chapter assignment */
  chapter: string;
  /** File size in bytes */
  size: number;
  /** Upload timestamp */
  uploadedAt: Date;
  /** Extracted PDF text content */
  textContent: string;
  /** File MIME type */
  mimeType: string;
}

/** Chapter with associated files */
export interface Chapter {
  /** Chapter display name */
  name: string;
  /** Files in this chapter */
  files: LibraryFile[];
  /** Number of files in chapter */
  fileCount: number;
  /** UI state for expansion (optional) */
  isExpanded?: boolean;
}

/** Chapter with files structure for API responses */
export interface ChapterFiles {
  /** Chapter name */
  chapter: string;
  /** Files in this chapter */
  files: LibraryFile[];
}

/**
 * File Library API Types
 * Request and response types for file library endpoints
 */

/** Request for uploading a file to the library */
export interface FileUploadRequest {
  /** File to upload */
  file: File;
  /** Chapter to assign the file to */
  chapter: string;
}

/** Response from file upload */
export interface FileUploadResponse {
  /** Indicates successful upload */
  success: boolean;
  /** Uploaded file details */
  file: LibraryFile;
  /** Error message if success is false */
  error?: string;
}

/** Response from getting the file library */
export interface FileLibraryResponse {
  /** Indicates successful retrieval */
  success: boolean;
  /** Chapters with their files */
  chapters: ChapterFiles[];
  /** Error message if success is false */
  error?: string;
}

/** Response from getting a specific file */
export interface FileResponse {
  /** Indicates successful retrieval */
  success: boolean;
  /** File details */
  file: LibraryFile;
  /** Error message if success is false */
  error?: string;
}

/** Request for renaming a chapter */
export interface ChapterRenameRequest {
  /** New chapter name */
  newName: string;
}

/** Generic response for file operations */
export interface FileOperationResponse {
  /** Indicates successful operation */
  success: boolean;
  /** Success message */
  message: string;
  /** Error message if success is false */
  error?: string;
}

/**
 * Error Handling Types
 * Enhanced error types for comprehensive error handling
 */

/** Network-related error with HTTP context */
export interface NetworkError extends Error {
  /** Error code (e.g., 'ECONNABORTED', 'NETWORK_ERROR') */
  code?: string;
  /** HTTP response information */
  response?: {
    /** HTTP status code */
    status: number;
    /** Response data containing error details */
    data?: ErrorResponse;
  };
  /** Original request object */
  request?: any;
}

/** Validation error for form inputs */
export interface ValidationError extends Error {
  /** Field that failed validation */
  field?: string;
  /** Value that failed validation */
  value?: any;
}

/** Error severity levels for UI presentation */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

/** Enhanced error object with localization and metadata */
export interface EnhancedError {
  /** Machine-readable error code */
  code: string;
  /** Original error message */
  message: string;
  /** Severity level for UI styling */
  severity: ErrorSeverity;
  /** Localized user-friendly messages */
  userMessage: {
    /** English message */
    en: string;
    /** Portuguese message */
    pt: string;
  };
  /** Whether the operation can be retried */
  retryable: boolean;
  /** ISO timestamp when error was processed */
  timestamp: string;
}

/**
 * File Library Error Types
 * Specific error types for file library operations
 */

/** File library operation error codes */
export type FileLibraryErrorCode = 
  | 'FILE_NOT_FOUND'
  | 'CHAPTER_NOT_FOUND'
  | 'INVALID_FILE_TYPE'
  | 'FILE_TOO_LARGE'
  | 'CHAPTER_NAME_INVALID'
  | 'CHAPTER_ALREADY_EXISTS'
  | 'UPLOAD_FAILED'
  | 'DELETE_FAILED'
  | 'RENAME_FAILED'
  | 'LIBRARY_LOAD_FAILED'
  | 'FILE_PROCESSING_FAILED';

/** File library specific error */
export interface FileLibraryError extends EnhancedError {
  /** File library specific error code */
  code: FileLibraryErrorCode;
  /** Context about the operation that failed */
  context?: {
    /** File ID if applicable */
    fileId?: string;
    /** Chapter name if applicable */
    chapter?: string;
    /** File name if applicable */
    fileName?: string;
  };
}

/**
 * Component Props Types
 * Type definitions for React component props
 */

/** Props for the FileUpload component */
export interface FileUploadProps {
  /** Callback when file is selected or cleared */
  onFileSelect: (file: File | null) => void;
  /** Currently selected file */
  selectedFile: File | null;
  /** Whether file is currently being uploaded */
  isUploading: boolean;
}

/** Props for the QuestionInput component */
export interface QuestionInputProps {
  /** Callback when question is submitted */
  onSubmit: (question: string) => void;
  /** Whether input should be disabled */
  disabled: boolean;
  /** Whether request is currently processing */
  isLoading: boolean;
  /** Name of the selected file */
  selectedFileName?: string;
  /** Chapter of the selected file */
  selectedFileChapter?: string;
}

/** Props for the ResponseDisplay component */
export interface ResponseDisplayProps {
  /** AI response text to display */
  response: string | null;
  /** Whether response is currently loading */
  isLoading: boolean;
  /** Error message to display */
  error: string | null;
}

/**
 * File Library Component Props
 * Props for file library related components
 */

/** Props for the FileLibraryPanel component */
export interface FileLibraryPanelProps {
  /** Currently selected file ID */
  selectedFileId: string | null;
  /** Callback when file is selected */
  onFileSelect: (fileId: string | null) => void;
  /** User role for permission-based UI */
  userRole: 'student' | 'teacher';
  /** Whether the panel is loading */
  isLoading?: boolean;
  /** Error state for the panel */
  error?: string | null;
}

/** Props for the FileUploadModal component */
export interface FileUploadModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Callback when upload succeeds */
  onUploadSuccess: (file: LibraryFile) => void;
  /** List of existing chapter names */
  existingChapters: string[];
  /** Whether upload is in progress */
  isUploading?: boolean;
}

/** State for the FileUploadModal component */
export interface FileUploadModalState {
  /** Selected file for upload */
  file: File | null;
  /** Selected chapter name */
  chapter: string;
  /** Custom chapter name input */
  customChapterName: string;
  /** Whether creating a new chapter */
  isCreatingNewChapter: boolean;
  /** Upload progress percentage */
  uploadProgress: number;
  /** Validation errors */
  errors: {
    file?: string;
    chapter?: string;
    customChapterName?: string;
  };
}

/** State for the FileLibraryPanel component */
export interface FileLibraryPanelState {
  /** Available chapters with files */
  chapters: Chapter[];
  /** Set of expanded chapter names */
  expandedChapters: Set<string>;
  /** Whether library is loading */
  isLoading: boolean;
  /** Error message if loading failed */
  error: string | null;
  /** Whether a file operation is in progress */
  isOperationInProgress: boolean;
}

/**
 * Application State Types
 * Types for managing application-wide state
 */

/** Supported languages for the application */
export type SupportedLanguage = 'en' | 'pt';

/** Main application state structure */
export interface AppState {
  /** Currently selected PDF file (legacy) */
  selectedFile: File | null;
  /** Currently selected file ID from library */
  selectedFileId: string | null;
  /** Current question text */
  question: string;
  /** AI response text */
  response: string | null;
  /** Whether AI request is processing */
  isLoading: boolean;
  /** Current error state */
  error: EnhancedError | null;
  /** Whether file is being uploaded */
  isUploading: boolean;
  /** Current UI language */
  language: SupportedLanguage;
  /** File library state */
  fileLibrary: {
    /** Available chapters with files */
    chapters: Chapter[];
    /** Whether library is loading */
    isLoading: boolean;
    /** Library error state */
    error: string | null;
    /** Last time library was refreshed */
    lastRefresh: Date | null;
  };
  /** File upload modal state */
  uploadModal: {
    /** Whether modal is open */
    isOpen: boolean;
    /** Whether upload is in progress */
    isUploading: boolean;
  };
}

/**
 * File Processing Types
 * Types related to file handling and validation
 */

/** Supported file types for upload */
export type SupportedFileType = 'application/pdf';

/** File validation result */
export interface FileValidationResult {
  /** Whether file passed validation */
  isValid: boolean;
  /** Error message if validation failed */
  error?: string;
  /** Validation details */
  details?: {
    /** File size in bytes */
    size: number;
    /** File MIME type */
    type: string;
    /** File extension */
    extension: string;
  };
}

/** File processing status */
export type FileProcessingStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'error';

/**
 * API Configuration Types
 * Types for API client configuration
 */

/** API client configuration */
export interface ApiConfig {
  /** Base URL for API requests */
  baseURL: string;
  /** Request timeout in milliseconds */
  timeout: number;
  /** Default headers to include */
  headers?: Record<string, string>;
}

/** HTTP methods supported by the API */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/** Generic API response wrapper */
export interface ApiResponse<T = any> {
  /** Response data */
  data: T;
  /** HTTP status code */
  status: number;
  /** Response headers */
  headers: Record<string, string>;
}

/**
 * Utility Types
 * Helper types for common patterns
 */

/** Function type for event handlers */
export type EventHandler<T = Event> = (event: T) => void;

/** Function type for async operations */
export type AsyncOperation<T = void> = () => Promise<T>;

/** Function type for callbacks with optional error */
export type Callback<T = any> = (error?: Error, result?: T) => void;

/**
 * File Library Utility Types
 * Helper types for file library operations
 */

/** File library operation types */
export type FileLibraryOperation = 
  | 'upload'
  | 'delete'
  | 'select'
  | 'rename-chapter'
  | 'load-library';

/** File library action types for state management */
export type FileLibraryAction = 
  | { type: 'LOAD_LIBRARY_START' }
  | { type: 'LOAD_LIBRARY_SUCCESS'; payload: ChapterFiles[] }
  | { type: 'LOAD_LIBRARY_ERROR'; payload: string }
  | { type: 'SELECT_FILE'; payload: string | null }
  | { type: 'UPLOAD_FILE_START' }
  | { type: 'UPLOAD_FILE_SUCCESS'; payload: LibraryFile }
  | { type: 'UPLOAD_FILE_ERROR'; payload: string }
  | { type: 'DELETE_FILE_SUCCESS'; payload: string }
  | { type: 'RENAME_CHAPTER_SUCCESS'; payload: { oldName: string; newName: string } }
  | { type: 'TOGGLE_CHAPTER_EXPANSION'; payload: string }
  | { type: 'OPEN_UPLOAD_MODAL' }
  | { type: 'CLOSE_UPLOAD_MODAL' };

/** File validation rules */
export interface FileValidationRules {
  /** Maximum file size in bytes */
  maxSize: number;
  /** Allowed MIME types */
  allowedTypes: string[];
  /** Allowed file extensions */
  allowedExtensions: string[];
}

/** Chapter validation rules */
export interface ChapterValidationRules {
  /** Minimum chapter name length */
  minLength: number;
  /** Maximum chapter name length */
  maxLength: number;
  /** Regex pattern for valid characters */
  pattern: RegExp;
  /** Reserved chapter names that cannot be used */
  reservedNames: string[];
}

/** File library configuration */
export interface FileLibraryConfig {
  /** File validation rules */
  fileValidation: FileValidationRules;
  /** Chapter validation rules */
  chapterValidation: ChapterValidationRules;
  /** Maximum number of files per chapter */
  maxFilesPerChapter: number;
  /** Maximum number of chapters */
  maxChapters: number;
  /** Auto-refresh interval in milliseconds */
  refreshInterval: number;
}