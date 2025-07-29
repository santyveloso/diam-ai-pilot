/**
 * Core API Types
 * These types define the structure of API requests and responses
 */

/** Request payload for asking questions about PDF content */
export interface AskRequest {
  /** The question to ask about the PDF content */
  question: string;
  /** The PDF file to analyze */
  file: File;
}

/** Successful response from the ask endpoint */
export interface AskResponse {
  /** The AI-generated response */
  response: string;
  /** Indicates successful processing */
  success: boolean;
  /** Error message if success is false */
  error?: string;
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
 * Application State Types
 * Types for managing application-wide state
 */

/** Supported languages for the application */
export type SupportedLanguage = 'en' | 'pt';

/** Main application state structure */
export interface AppState {
  /** Currently selected PDF file */
  selectedFile: File | null;
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

/** Make all properties optional */
export type Partial<T> = {
  [P in keyof T]?: T[P];
};

/** Pick specific properties from a type */
export type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};

/** Omit specific properties from a type */
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

/** Function type for event handlers */
export type EventHandler<T = Event> = (event: T) => void;

/** Function type for async operations */
export type AsyncOperation<T = void> = () => Promise<T>;

/** Function type for callbacks with optional error */
export type Callback<T = any> = (error?: Error, result?: T) => void;