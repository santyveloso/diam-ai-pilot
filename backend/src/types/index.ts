/**
 * Backend Type Definitions
 * Comprehensive type definitions for the DIAM AI Pilot backend
 */

import { Request, Response, NextFunction } from 'express';

/**
 * API Request/Response Types
 * Types for HTTP API communication
 */

/** Request body for the /api/ask endpoint */
export interface AskRequest {
  /** The question to ask about the uploaded PDF */
  question: string;
  // Note: File is handled separately via multipart/form-data
}

/** Successful response from the /api/ask endpoint */
export interface AskResponse {
  /** The AI-generated response text */
  response: string;
  /** Always true for successful responses */
  success: boolean;
  /** Error message (only present if success is false) */
  error?: string;
}

/** Error response structure for all API endpoints */
export interface ErrorResponse {
  /** Always false for error responses */
  success: false;
  /** Error details object */
  error: {
    /** Machine-readable error code for client handling */
    code: string;
    /** Human-readable error message */
    message: string;
    /** Additional error details (only in development) */
    details?: any;
    /** ISO timestamp when error occurred */
    timestamp?: string;
    /** Unique request identifier for tracking */
    requestId?: string;
  };
}

/** Health check response structure */
export interface HealthResponse {
  /** Service status indicator */
  status: 'OK' | 'ERROR';
  /** Descriptive status message */
  message: string;
  /** ISO timestamp of health check */
  timestamp: string;
  /** Current environment (development/production) */
  environment: string;
  /** Status of external services */
  services: {
    /** Gemini AI API status */
    gemini: 'healthy' | 'unhealthy' | 'unknown';
  };
  /** Server uptime in seconds */
  uptime: number;
}

/**
 * Error Handling Types
 * Enhanced error system for comprehensive error management
 */

/** Custom service error class with additional metadata */
export interface ServiceError extends Error {
  /** Machine-readable error code */
  code: string;
  /** HTTP status code to return */
  statusCode: number;
  /** Localized user-friendly messages */
  userMessage?: {
    /** English error message */
    en: string;
    /** Portuguese error message */
    pt: string;
  };
  /** Whether the operation can be safely retried */
  retryable?: boolean;
  /** Additional error context and debugging information */
  details?: any;
}

/** Error severity levels for logging and monitoring */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

/** Context information for error tracking and debugging */
export interface ErrorContext {
  /** Unique identifier for this request */
  requestId: string;
  /** ISO timestamp when error occurred */
  timestamp: string;
  /** Client user agent string */
  userAgent?: string;
  /** Client IP address */
  ip?: string;
  /** API endpoint that generated the error */
  endpoint?: string;
}

/** Supported error codes with their properties */
export type ErrorCode = 
  | 'MISSING_FILE'
  | 'MISSING_QUESTION'
  | 'INVALID_FILE_TYPE'
  | 'FILE_TOO_LARGE'
  | 'QUESTION_TOO_SHORT'
  | 'QUESTION_TOO_LONG'
  | 'PDF_PROCESSING_ERROR'
  | 'AI_GENERATION_ERROR'
  | 'RATE_LIMIT_EXCEEDED'
  | 'API_CONFIGURATION_ERROR'
  | 'INTERNAL_SERVER_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'INVALID_CONTENT';

/**
 * File Processing Types
 * Types for PDF file handling and processing
 */

/** Result of PDF file processing */
export interface ProcessedFile {
  /** Original filename as uploaded */
  originalName: string;
  /** MIME type of the uploaded file */
  mimeType: string;
  /** File size in bytes */
  size: number;
  /** Extracted text content from the PDF */
  textContent: string;
  /** Timestamp when text was extracted */
  extractedAt: Date;
}

/** File validation constraints */
export interface FileConstraints {
  /** Maximum allowed file size in bytes */
  maxSize: number;
  /** Allowed MIME types */
  allowedMimeTypes: string[];
  /** Allowed file extensions */
  allowedExtensions: string[];
}

/** File processing status */
export type FileProcessingStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed';

/**
 * AI Processing Types
 * Types for AI model interaction and response generation
 */

/** Context object for AI question processing */
export interface QuestionContext {
  /** The user's question */
  question: string;
  /** Extracted text content from the PDF */
  documentContent: string;
  /** When the question was asked */
  timestamp: Date;
  /** Detected or specified language */
  language: 'pt' | 'en';
}

/** Response from AI model processing */
export interface AIResponse {
  /** The generated answer text */
  answer: string;
  /** Confidence score (0-1) for the response quality */
  confidence?: number;
  /** Sources used to generate the response */
  sources?: string[];
  /** Time taken to generate response in milliseconds */
  processingTime: number;
}

/** AI model configuration */
export interface AIModelConfig {
  /** Model name/version to use */
  model: string;
  /** Maximum tokens for response */
  maxTokens?: number;
  /** Temperature for response generation */
  temperature?: number;
  /** API timeout in milliseconds */
  timeout?: number;
}

/**
 * Request Processing Types
 * Types for HTTP request handling and middleware
 */

/** Extended Express request with additional properties */
export interface ExtendedRequest extends Request {
  /** Unique request identifier */
  requestId: string;
  /** Request start time for performance tracking */
  startTime: number;
  /** Detected client language */
  language?: 'en' | 'pt';
}

/** Request validation result */
export interface ValidationResult {
  /** Whether validation passed */
  isValid: boolean;
  /** Validation errors if any */
  errors?: string[];
  /** Sanitized/normalized data */
  data?: any;
}

/** Rate limiting information */
export interface RateLimitInfo {
  /** Maximum requests allowed */
  limit: number;
  /** Remaining requests in current window */
  remaining: number;
  /** When the rate limit window resets */
  resetTime: Date;
  /** Whether limit has been exceeded */
  exceeded: boolean;
}

/**
 * Configuration Types
 * Types for application configuration
 */

/** Server configuration */
export interface ServerConfig {
  /** Port to listen on */
  port: number;
  /** Environment (development/production) */
  environment: string;
  /** CORS configuration */
  cors: {
    /** Allowed origins */
    origins: string[];
    /** Allowed methods */
    methods: string[];
    /** Allowed headers */
    headers: string[];
  };
}

/** File upload configuration */
export interface UploadConfig {
  /** Directory for temporary file storage */
  uploadDir: string;
  /** Maximum file size in bytes */
  maxFileSize: number;
  /** Allowed file types */
  allowedTypes: string[];
  /** Whether to preserve original filenames */
  preserveFilename: boolean;
}

/** AI service configuration */
export interface AIConfig {
  /** API key for the AI service */
  apiKey: string;
  /** Model to use for generation */
  model: string;
  /** Request timeout in milliseconds */
  timeout: number;
  /** Maximum retries for failed requests */
  maxRetries: number;
}

/**
 * Logging and Monitoring Types
 * Types for application logging and monitoring
 */

/** Log entry structure */
export interface LogEntry {
  /** Log level */
  level: 'debug' | 'info' | 'warn' | 'error';
  /** Log message */
  message: string;
  /** Timestamp */
  timestamp: string;
  /** Request ID for correlation */
  requestId?: string;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/** Performance metrics */
export interface PerformanceMetrics {
  /** Request processing time in milliseconds */
  requestTime: number;
  /** File processing time in milliseconds */
  fileProcessingTime?: number;
  /** AI processing time in milliseconds */
  aiProcessingTime?: number;
  /** Memory usage in bytes */
  memoryUsage?: number;
}

/**
 * Utility Types
 * Helper types for common patterns
 */

/** Make all properties optional */
export type Partial<T> = {
  [P in keyof T]?: T[P];
};

/** Make specific properties required */
export type Required<T, K extends keyof T> = T & {
  [P in K]-?: T[P];
};

/** Extract the return type of a promise */
export type PromiseType<T> = T extends Promise<infer U> ? U : T;

/** Function type for async operations */
export type AsyncFunction<T = any, R = any> = (arg: T) => Promise<R>;

/** Function type for middleware */
export type MiddlewareFunction = (
  req: ExtendedRequest,
  res: Express.Response,
  next: NextFunction
) => void | Promise<void>;