// API Request/Response Types
export interface AskRequest {
  question: string;
}

export interface AskResponse {
  response: string;
  success: boolean;
  error?: string;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp?: string;
    requestId?: string;
  };
}

// Enhanced error types for better error handling
export interface ServiceError extends Error {
  code: string;
  statusCode: number;
  userMessage?: {
    en: string;
    pt: string;
  };
  retryable?: boolean;
  details?: any;
}

// Error severity levels
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ErrorContext {
  requestId: string;
  timestamp: string;
  userAgent?: string;
  ip?: string;
  endpoint?: string;
}

// File Processing Types
export interface ProcessedFile {
  originalName: string;
  mimeType: string;
  size: number;
  textContent: string;
  extractedAt: Date;
}

// Question Context
export interface QuestionContext {
  question: string;
  documentContent: string;
  timestamp: Date;
  language: 'pt' | 'en';
}

// AI Response
export interface AIResponse {
  answer: string;
  confidence?: number;
  sources?: string[];
  processingTime: number;
}