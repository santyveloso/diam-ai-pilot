import axios from 'axios';
import { AskRequest, AskResponse } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout for AI processing
});

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
  const response = await api.get('/health');
  return response.data;
};

export default api;