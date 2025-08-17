import request from 'supertest';
import express from 'express';
import { FileLibraryService } from '../services/fileLibraryService';
import { ErrorService } from '../services/errorService';
import { PDFProcessor } from '../services/pdfProcessor';
import { GeminiClient } from '../services/geminiClient';
import apiRouter from '../routes/api';
import { LibraryFile } from '../types';

// Mock dependencies
jest.mock('../services/fileLibraryService');
jest.mock('../services/errorService');
jest.mock('../services/pdfProcessor');
jest.mock('../services/geminiClient');
jest.mock('../middleware/rateLimiter', () => ({
  rateLimitMiddleware: (req: any, res: any, next: any) => next()
}));
jest.mock('../middleware/googleAuth', () => ({
  verifyGoogleToken: (req: any, res: any, next: any) => {
    req.user = { id: 'test-user' };
    next();
  }
}));

const mockFileLibraryService = FileLibraryService as jest.Mocked<typeof FileLibraryService>;
const mockErrorService = ErrorService as jest.Mocked<typeof ErrorService>;
const mockPDFProcessor = PDFProcessor as jest.Mocked<typeof PDFProcessor>;
const mockGeminiClient = GeminiClient as jest.Mocked<typeof GeminiClient>;

describe('POST /api/ask - File Library Integration', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api', apiRouter);

    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mocks
    mockErrorService.validateQuestion.mockReturnValue('What is this about?');
    mockErrorService.createError.mockImplementation((code, message) => {
      const error = new Error(message || code) as any;
      error.code = code;
      error.statusCode = 400;
      return error;
    });

    // Mock Gemini client constructor and instance methods
    const mockGeminiInstance = {
      createQuestionContext: jest.fn().mockReturnValue({
        question: 'What is this about?',
        documentContent: 'Sample content',
        timestamp: new Date(),
        language: 'en'
      }),
      generateResponse: jest.fn().mockResolvedValue({
        answer: 'This is a test response',
        processingTime: 100
      })
    };
    
    // Mock the constructor to return our mock instance
    (GeminiClient as any).mockImplementation(() => mockGeminiInstance);
  });

  describe('File Library Mode (fileId parameter)', () => {
    it('should process question with valid fileId', async () => {
      const mockLibraryFile: LibraryFile = {
        id: 'test-file-id',
        originalName: 'test.pdf',
        chapter: 'Chapter 1',
        size: 1024,
        uploadedAt: new Date(),
        textContent: 'Sample PDF content for testing',
        mimeType: 'application/pdf'
      };

      mockFileLibraryService.getFileById.mockResolvedValue(mockLibraryFile);

      const response = await request(app)
        .post('/api/ask')
        .send({
          question: 'What is this about?',
          fileId: 'test-file-id'
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        response: 'This is a test response',
        fileUsed: 'test.pdf'
      });

      expect(mockFileLibraryService.getFileById).toHaveBeenCalledWith('test-file-id');
      expect(mockErrorService.validateQuestion).toHaveBeenCalledWith('What is this about?');
    });

    it('should return 404 when fileId not found', async () => {
      mockFileLibraryService.getFileById.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/ask')
        .send({
          question: 'What is this about?',
          fileId: 'nonexistent-id'
        });

      expect(response.status).toBe(400);
      expect(mockFileLibraryService.getFileById).toHaveBeenCalledWith('nonexistent-id');
    });

    it('should return 400 for invalid fileId', async () => {
      const response = await request(app)
        .post('/api/ask')
        .send({
          question: 'What is this about?',
          fileId: ''
        });

      expect(response.status).toBe(400);
      expect(mockFileLibraryService.getFileById).not.toHaveBeenCalled();
    });

    it('should return 400 for library file with no content', async () => {
      const mockLibraryFile: LibraryFile = {
        id: 'test-file-id',
        originalName: 'test.pdf',
        chapter: 'Chapter 1',
        size: 1024,
        uploadedAt: new Date(),
        textContent: '', // Empty content
        mimeType: 'application/pdf'
      };

      mockFileLibraryService.getFileById.mockResolvedValue(mockLibraryFile);

      const response = await request(app)
        .post('/api/ask')
        .send({
          question: 'What is this about?',
          fileId: 'test-file-id'
        });

      expect(response.status).toBe(400);
      expect(mockFileLibraryService.getFileById).toHaveBeenCalledWith('test-file-id');
    });
  });

  describe('File Upload Mode (backward compatibility)', () => {
    it('should process question with file upload when no fileId provided', async () => {
      const mockProcessedFile = {
        originalName: 'uploaded.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        textContent: 'Uploaded PDF content',
        extractedAt: new Date()
      };

      mockErrorService.validateFileUpload.mockImplementation(() => {});
      mockPDFProcessor.processFile.mockResolvedValue(mockProcessedFile);
      mockPDFProcessor.validateTextContent.mockImplementation(() => {});
      mockPDFProcessor.cleanupFile.mockResolvedValue();

      const response = await request(app)
        .post('/api/ask')
        .field('question', 'What is this about?')
        .attach('file', Buffer.from('fake pdf content'), 'test.pdf');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        response: 'This is a test response',
        fileUsed: 'uploaded.pdf'
      });

      expect(mockErrorService.validateFileUpload).toHaveBeenCalled();
      expect(mockPDFProcessor.processFile).toHaveBeenCalled();
      expect(mockPDFProcessor.cleanupFile).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should return 400 when neither fileId nor file provided', async () => {
      const response = await request(app)
        .post('/api/ask')
        .send({
          question: 'What is this about?'
        });

      expect(response.status).toBe(400);
      expect(mockFileLibraryService.getFileById).not.toHaveBeenCalled();
      expect(mockPDFProcessor.processFile).not.toHaveBeenCalled();
    });

    it('should prioritize fileId over file upload when both provided', async () => {
      const mockLibraryFile: LibraryFile = {
        id: 'test-file-id',
        originalName: 'library.pdf',
        chapter: 'Chapter 1',
        size: 1024,
        uploadedAt: new Date(),
        textContent: 'Library file content',
        mimeType: 'application/pdf'
      };

      mockFileLibraryService.getFileById.mockResolvedValue(mockLibraryFile);

      const response = await request(app)
        .post('/api/ask')
        .field('question', 'What is this about?')
        .field('fileId', 'test-file-id')
        .attach('file', Buffer.from('fake pdf content'), 'test.pdf');

      expect(response.status).toBe(200);
      expect(response.body.fileUsed).toBe('library.pdf');

      expect(mockFileLibraryService.getFileById).toHaveBeenCalledWith('test-file-id');
      expect(mockPDFProcessor.processFile).not.toHaveBeenCalled();
    });
  });
});