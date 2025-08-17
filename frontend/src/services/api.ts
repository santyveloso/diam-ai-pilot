import axios from 'axios';
import { AskRequest, AskResponse, FileLibraryResponse, FileUploadResponse, FileOperationResponse, ChapterRenameRequest, LibraryFile } from '../types';
import { authService } from './authService';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout for AI processing
});

// Add Google token to requests
api.interceptors.request.use(
  (config) => {
    // In development mode, use a simple development token for API calls
    if (process.env.NODE_ENV === 'development') {
      config.headers = config.headers || {};
      config.headers.Authorization = 'Bearer development-token';
    } else {
      const token = authService.getGoogleToken();
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && process.env.NODE_ENV !== 'development') {
      // Token expired or invalid, redirect to login (only in production)
      authService.logout();
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const askQuestion = async (question: string, file: File): Promise<AskResponse> => {
  const formData = new FormData();
  formData.append('question', question);
  formData.append('file', file);

  const response = await api.post<AskResponse>('/api/ask', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

export const healthCheck = async (): Promise<{ status: string; message: string }> => {
  const response = await api.get('/api/health');
  return response.data;
};

// File Library API Functions
export const getFileLibrary = async (): Promise<FileLibraryResponse> => {
  const response = await api.get<FileLibraryResponse>('/api/files/library');
  return response.data;
};

export const uploadFile = async (file: File, chapter: string): Promise<FileUploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('chapter', chapter);

  const response = await api.post<FileUploadResponse>('/api/files/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

export const deleteFile = async (fileId: string): Promise<FileOperationResponse> => {
  const response = await api.delete<FileOperationResponse>(`/api/files/${fileId}`);
  return response.data;
};

export const renameChapter = async (oldName: string, newName: string): Promise<FileOperationResponse> => {
  const response = await api.put<FileOperationResponse>(`/api/files/chapters/${encodeURIComponent(oldName)}`, {
    newName
  } as ChapterRenameRequest);
  return response.data;
};

export const askQuestionWithFileId = async (question: string, fileId: string): Promise<AskResponse> => {
  const response = await api.post<AskResponse>('/api/ask', {
    question,
    fileId
  });

  return response.data;
};

export default api;