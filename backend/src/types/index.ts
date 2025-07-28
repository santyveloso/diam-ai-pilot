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
  };
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