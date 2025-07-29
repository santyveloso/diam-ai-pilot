// API Request/Response Types
export interface AskRequest {
  question: string;
  file: File;
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
export interface NetworkError extends Error {
  code?: string;
  response?: {
    status: number;
    data?: ErrorResponse;
  };
  request?: any;
}

export interface ValidationError extends Error {
  field?: string;
  value?: any;
}

// Error severity levels
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface EnhancedError {
  code: string;
  message: string;
  severity: ErrorSeverity;
  userMessage: {
    en: string;
    pt: string;
  };
  retryable: boolean;
  timestamp: string;
}

// Component Props Types
export interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
  isUploading: boolean;
}

export interface QuestionInputProps {
  onSubmit: (question: string) => void;
  disabled: boolean;
  isLoading: boolean;
}

export interface ResponseDisplayProps {
  response: string | null;
  isLoading: boolean;
  error: string | null;
}