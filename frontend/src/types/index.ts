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
  };
}

// Component Props Types
export interface FileUploadProps {
  onFileSelect: (file: File) => void;
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