/**
 * Frontend File Library Integration Tests
 * End-to-end tests for complete file library workflows in the frontend
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../components/App';
import { getFileLibrary, uploadFile, deleteFile, askQuestionWithFileId } from '../services/api';

// Mock the auth context
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      name: 'Test User',
      email: 'test@iscte.pt',
      picture: 'https://example.com/avatar.jpg'
    },
    logout: jest.fn()
  })
}));

// Mock the API services
jest.mock('../services/api', () => ({
  getFileLibrary: jest.fn(),
  uploadFile: jest.fn(),
  deleteFile: jest.fn(),
  renameChapter: jest.fn(),
  askQuestionWithFileId: jest.fn(),
  askQuestion: jest.fn()
}));

// Mock the error service
jest.mock('../services/errorService', () => ({
  ErrorService: {
    processError: jest.fn().mockReturnValue({
      code: 'TEST_ERROR',
      message: 'Test error',
      severity: 'medium',
      userMessage: { pt: 'Erro de teste', en: 'Test error' },
      retryable: true,
      timestamp: new Date().toISOString()
    }),
    getUserMessage: jest.fn().mockReturnValue('Test error message'),
    isRetryable: jest.fn().mockReturnValue(true),
    logError: jest.fn()
  }
}));

// File library service functions are in api.ts

const mockGetFileLibrary = getFileLibrary as jest.MockedFunction<typeof getFileLibrary>;
const mockUploadFile = uploadFile as jest.MockedFunction<typeof uploadFile>;
const mockDeleteFile = deleteFile as jest.MockedFunction<typeof deleteFile>;
const mockAskQuestionWithFileId = askQuestionWithFileId as jest.MockedFunction<typeof askQuestionWithFileId>;

describe('File Library Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete File Upload and Selection Workflow', () => {
    it('should handle complete file upload and selection workflow', async () => {
      // Mock initial empty library
      mockGetFileLibrary.mockResolvedValueOnce({
        success: true,
        chapters: []
      });

      // Mock successful file upload
      const mockUploadedFile = {
        id: 'test-file-id',
        originalName: 'test-document.pdf',
        chapter: 'Test Chapter',
        size: 1024,
        uploadedAt: new Date(),
        textContent: 'Test content',
        mimeType: 'application/pdf'
      };

      mockUploadFile.mockResolvedValue({
        success: true,
        file: mockUploadedFile
      });

      // Mock library after upload
      mockGetFileLibrary.mockResolvedValue({
        success: true,
        chapters: [{
          chapter: 'Test Chapter',
          files: [mockUploadedFile]
        }]
      });

      render(<App />);

      // Wait for initial library load
      await waitFor(() => {
        expect(screen.getByText('Nenhum arquivo encontrado')).toBeInTheDocument();
      });

      // Step 1: Open upload modal
      const uploadButton = screen.getByText('Carregar ficheiro');
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText('Upload Course Material')).toBeInTheDocument();
      });

      // Step 2: Select file and chapter
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['test content'], 'test-document.pdf', { type: 'application/pdf' });
      
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });
      fireEvent.change(fileInput);

      // Select create new chapter
      const chapterSelect = screen.getByLabelText('Chapter');
      fireEvent.change(chapterSelect, { target: { value: '__new__' } });

      // Enter chapter name
      const chapterInput = screen.getByLabelText('New Chapter Name');
      fireEvent.change(chapterInput, { target: { value: 'Test Chapter' } });

      // Step 3: Submit upload
      const submitButton = screen.getByText('Upload File');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockUploadFile).toHaveBeenCalledWith(file, 'Test Chapter');
      });

      // Step 4: Verify library updates and modal closes
      await waitFor(() => {
        expect(screen.queryByText('Upload Course Material')).not.toBeInTheDocument();
      });

      // Step 5: Verify file appears in library
      await waitFor(() => {
        expect(screen.getByText('Test Chapter')).toBeInTheDocument();
      });

      // Expand chapter to see file
      const chapterHeader = screen.getByText('Test Chapter');
      fireEvent.click(chapterHeader);

      await waitFor(() => {
        expect(screen.getByText('test-document.pdf')).toBeInTheDocument();
      });

      // Step 6: Select file
      const fileItem = screen.getByText('test-document.pdf');
      fireEvent.click(fileItem);

      // Verify file selection UI updates
      await waitFor(() => {
        expect(screen.getByText('Arquivo Selecionado')).toBeInTheDocument();
      });
    });
  });

  describe('File Selection to Question Submission Workflow', () => {
    it('should handle complete question workflow', async () => {
      const mockFile = {
        id: 'test-file-id',
        originalName: 'test-document.pdf',
        chapter: 'Test Chapter',
        size: 1024,
        uploadedAt: new Date(),
        textContent: 'Test content',
        mimeType: 'application/pdf'
      };

      // Mock library with file
      mockGetFileLibrary.mockResolvedValue({
        success: true,
        chapters: [{
          chapter: 'Test Chapter',
          files: [mockFile]
        }]
      });

      // Mock successful question response
      mockAskQuestionWithFileId.mockResolvedValue({
        success: true,
        response: 'This document discusses testing methodologies.',
        fileUsed: 'test-document.pdf'
      });

      render(<App />);

      // Wait for library to load
      await waitFor(() => {
        expect(screen.getByText('Test Chapter')).toBeInTheDocument();
      });

      // Step 1: Expand chapter and select file
      const chapterHeader = screen.getByText('Test Chapter');
      fireEvent.click(chapterHeader);

      await waitFor(() => {
        expect(screen.getByText('test-document.pdf')).toBeInTheDocument();
      });

      const fileItem = screen.getByText('test-document.pdf');
      fireEvent.click(fileItem);

      // Step 2: Enter question
      const questionTextarea = screen.getByPlaceholderText(/Type your question here/);
      fireEvent.change(questionTextarea, { 
        target: { value: 'What is the main topic of this document?' } 
      });

      // Step 3: Submit question
      const askButton = screen.getByText('Ask Question');
      fireEvent.click(askButton);

      // Step 4: Verify API call
      await waitFor(() => {
        expect(mockAskQuestionWithFileId).toHaveBeenCalledWith(
          'What is the main topic of this document?',
          'test-file-id'
        );
      });

      // Step 5: Verify response appears
      await waitFor(() => {
        expect(screen.getByText('This document discusses testing methodologies.')).toBeInTheDocument();
      });
    });

    it('should show proper validation when no file is selected', async () => {
      mockGetFileLibrary.mockResolvedValue({
        success: true,
        chapters: []
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Selecione um arquivo')).toBeInTheDocument();
      });

      // Try to enter question without selecting file
      const questionTextarea = screen.getByPlaceholderText(/Please select a file/);
      expect(questionTextarea).toBeDisabled();

      const askButton = screen.getByText('Ask Question');
      expect(askButton).toBeDisabled();
    });
  });

  describe('Teacher File Management Workflow', () => {
    it('should handle file deletion workflow for teachers', async () => {
      const mockFile = {
        id: 'test-file-id',
        originalName: 'test-document.pdf',
        chapter: 'Test Chapter',
        size: 1024,
        uploadedAt: new Date(),
        textContent: 'Test content',
        mimeType: 'application/pdf'
      };

      // Mock library with file
      mockGetFileLibrary.mockResolvedValueOnce({
        success: true,
        chapters: [{
          chapter: 'Test Chapter',
          files: [mockFile]
        }]
      });

      // Mock successful deletion
      mockDeleteFile.mockResolvedValue({
        success: true,
        message: 'File deleted successfully'
      });

      // Mock library after deletion
      mockGetFileLibrary.mockResolvedValue({
        success: true,
        chapters: []
      });

      // Mock window.confirm
      jest.spyOn(window, 'confirm').mockImplementation(() => true);

      render(<App />);

      // Wait for library to load
      await waitFor(() => {
        expect(screen.getByText('Test Chapter')).toBeInTheDocument();
      });

      // Expand chapter
      const chapterHeader = screen.getByText('Test Chapter');
      fireEvent.click(chapterHeader);

      await waitFor(() => {
        expect(screen.getByText('test-document.pdf')).toBeInTheDocument();
      });

      // Find and click delete button (teacher should see it)
      const deleteButton = screen.getByTitle('Excluir arquivo');
      fireEvent.click(deleteButton);

      // Verify deletion API call
      await waitFor(() => {
        expect(mockDeleteFile).toHaveBeenCalledWith('test-file-id');
      });

      // Verify file is removed from UI
      await waitFor(() => {
        expect(screen.queryByText('test-document.pdf')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle upload errors gracefully', async () => {
      mockGetFileLibrary.mockResolvedValue({
        success: true,
        chapters: []
      });

      // Mock upload failure
      mockUploadFile.mockRejectedValue(new Error('Upload failed'));

      render(<App />);

      // Open upload modal
      const uploadButton = screen.getByText('Carregar ficheiro');
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText('Upload Course Material')).toBeInTheDocument();
      });

      // Select file and chapter
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });
      fireEvent.change(fileInput);

      const chapterSelect = screen.getByLabelText('Chapter');
      fireEvent.change(chapterSelect, { target: { value: '__new__' } });

      const chapterInput = screen.getByLabelText('New Chapter Name');
      fireEvent.change(chapterInput, { target: { value: 'Test Chapter' } });

      // Submit upload
      const submitButton = screen.getByText('Upload File');
      fireEvent.click(submitButton);

      // Verify error is shown
      await waitFor(() => {
        expect(screen.getByText('Upload failed')).toBeInTheDocument();
      });

      // Modal should still be open for retry
      expect(screen.getByText('Upload Course Material')).toBeInTheDocument();
    });

    it('should handle library loading errors', async () => {
      mockGetFileLibrary.mockRejectedValue(new Error('Failed to load library'));

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Test error message')).toBeInTheDocument();
        expect(screen.getByText('Tentar novamente')).toBeInTheDocument();
      });

      // Test retry functionality
      const retryButton = screen.getByText('Tentar novamente');
      
      // Mock successful retry
      mockGetFileLibrary.mockResolvedValue({
        success: true,
        chapters: []
      });

      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('Nenhum arquivo encontrado')).toBeInTheDocument();
      });
    });

    it('should handle question submission errors', async () => {
      const mockFile = {
        id: 'test-file-id',
        originalName: 'test-document.pdf',
        chapter: 'Test Chapter',
        size: 1024,
        uploadedAt: new Date(),
        textContent: 'Test content',
        mimeType: 'application/pdf'
      };

      mockGetFileLibrary.mockResolvedValue({
        success: true,
        chapters: [{
          chapter: 'Test Chapter',
          files: [mockFile]
        }]
      });

      // Mock question failure
      mockAskQuestionWithFileId.mockRejectedValue(new Error('AI service unavailable'));

      render(<App />);

      // Select file
      await waitFor(() => {
        expect(screen.getByText('Test Chapter')).toBeInTheDocument();
      });

      const chapterHeader = screen.getByText('Test Chapter');
      fireEvent.click(chapterHeader);

      await waitFor(() => {
        expect(screen.getByText('test-document.pdf')).toBeInTheDocument();
      });

      const fileItem = screen.getByText('test-document.pdf');
      fireEvent.click(fileItem);

      // Submit question
      const questionTextarea = screen.getByPlaceholderText(/Type your question here/);
      fireEvent.change(questionTextarea, { 
        target: { value: 'Test question' } 
      });

      const askButton = screen.getByText('Ask Question');
      fireEvent.click(askButton);

      // Verify error is displayed
      await waitFor(() => {
        expect(screen.getByText('Test error message')).toBeInTheDocument();
      });
    });
  });

  describe('State Synchronization', () => {
    it('should maintain consistent state across operations', async () => {
      const mockFile1 = {
        id: 'file-1',
        originalName: 'document1.pdf',
        chapter: 'Chapter 1',
        size: 1024,
        uploadedAt: new Date(),
        textContent: 'Content 1',
        mimeType: 'application/pdf'
      };

      const mockFile2 = {
        id: 'file-2',
        originalName: 'document2.pdf',
        chapter: 'Chapter 1',
        size: 2048,
        uploadedAt: new Date(),
        textContent: 'Content 2',
        mimeType: 'application/pdf'
      };

      // Initial state with two files
      mockGetFileLibrary.mockResolvedValueOnce({
        success: true,
        chapters: [{
          chapter: 'Chapter 1',
          files: [mockFile1, mockFile2]
        }]
      });

      render(<App />);

      // Verify initial state
      await waitFor(() => {
        expect(screen.getByText('Chapter 1')).toBeInTheDocument();
      });

      const chapterHeader = screen.getByText('Chapter 1');
      fireEvent.click(chapterHeader);

      await waitFor(() => {
        expect(screen.getByText('document1.pdf')).toBeInTheDocument();
        expect(screen.getByText('document2.pdf')).toBeInTheDocument();
      });

      // Select first file
      const file1Item = screen.getByText('document1.pdf');
      fireEvent.click(file1Item);

      await waitFor(() => {
        expect(screen.getByText('Arquivo Selecionado')).toBeInTheDocument();
      });

      // Mock deletion and updated library state
      mockDeleteFile.mockResolvedValue({
        success: true,
        message: 'File deleted successfully'
      });

      mockGetFileLibrary.mockResolvedValue({
        success: true,
        chapters: [{
          chapter: 'Chapter 1',
          files: [mockFile2]
        }]
      });

      // Mock window.confirm
      jest.spyOn(window, 'confirm').mockImplementation(() => true);

      // Delete the selected file
      const deleteButtons = screen.getAllByTitle('Excluir arquivo');
      fireEvent.click(deleteButtons[0]);

      // Verify file is removed and selection is cleared
      await waitFor(() => {
        expect(screen.queryByText('document1.pdf')).not.toBeInTheDocument();
        expect(screen.getByText('document2.pdf')).toBeInTheDocument();
        expect(screen.getByText('Selecione um arquivo')).toBeInTheDocument();
      });
    });
  });
});