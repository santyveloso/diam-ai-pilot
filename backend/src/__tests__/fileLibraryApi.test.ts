/**
 * File Library API Endpoints Tests
 * Tests for the new file library management endpoints
 */

import request from 'supertest';
import app from '../server';
import { FileLibraryService } from '../services/fileLibraryService';

// Mock the FileLibraryService
jest.mock('../services/fileLibraryService');
const mockFileLibraryService = FileLibraryService as jest.Mocked<typeof FileLibraryService>;

// Mock Google Auth middleware
jest.mock('../middleware/googleAuth', () => ({
  verifyGoogleToken: (req: any, res: any, next: any) => {
    req.user = { id: 'test-user', email: 'test@example.com' };
    next();
  }
}));

// Mock PDF processor
jest.mock('../services/pdfProcessor', () => ({
  PDFProcessor: {
    processFile: jest.fn().mockResolvedValue({
      originalName: 'test.pdf',
      mimeType: 'application/pdf',
      size: 1024,
      textContent: 'Test PDF content',
      extractedAt: new Date()
    }),
    validateTextContent: jest.fn(),
    cleanupFile: jest.fn().mockResolvedValue(undefined)
  }
}));

describe('File Library API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/files/upload', () => {
    it('should upload a file successfully', async () => {
      const mockLibraryFile = {
        id: 'test-file-id',
        originalName: 'test.pdf',
        chapter: 'Chapter 1',
        size: 1024,
        uploadedAt: new Date(),
        textContent: 'Test PDF content',
        mimeType: 'application/pdf'
      };

      mockFileLibraryService.uploadFile.mockResolvedValue(mockLibraryFile);

      const response = await request(app)
        .post('/api/files/upload')
        .field('chapter', 'Chapter 1')
        .attach('file', Buffer.from('fake pdf content'), 'test.pdf');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.file).toEqual(mockLibraryFile);
      expect(mockFileLibraryService.uploadFile).toHaveBeenCalled();
    });

    it('should return error when chapter is missing', async () => {
      const response = await request(app)
        .post('/api/files/upload')
        .attach('file', Buffer.from('fake pdf content'), 'test.pdf');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_CHAPTER');
    });
  });

  describe('GET /api/files/library', () => {
    it('should retrieve file library successfully', async () => {
      const mockChapters = [
        {
          chapter: 'Chapter 1',
          files: [
            {
              id: 'file-1',
              originalName: 'test1.pdf',
              chapter: 'Chapter 1',
              size: 1024,
              uploadedAt: new Date(),
              textContent: 'Content 1',
              mimeType: 'application/pdf'
            }
          ]
        }
      ];

      mockFileLibraryService.getFilesByChapter.mockResolvedValue(mockChapters);

      const response = await request(app)
        .get('/api/files/library');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.chapters).toEqual(mockChapters);
      expect(mockFileLibraryService.getFilesByChapter).toHaveBeenCalled();
    });
  });

  describe('GET /api/files/:fileId', () => {
    it('should retrieve a specific file successfully', async () => {
      const mockFile = {
        id: 'test-file-id',
        originalName: 'test.pdf',
        chapter: 'Chapter 1',
        size: 1024,
        uploadedAt: new Date(),
        textContent: 'Test content',
        mimeType: 'application/pdf'
      };

      mockFileLibraryService.getFileById.mockResolvedValue(mockFile);

      const response = await request(app)
        .get('/api/files/test-file-id');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.file).toEqual(mockFile);
      expect(mockFileLibraryService.getFileById).toHaveBeenCalledWith('test-file-id');
    });

    it('should return 404 when file not found', async () => {
      mockFileLibraryService.getFileById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/files/nonexistent-id');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FILE_NOT_FOUND');
    });
  });

  describe('DELETE /api/files/:fileId', () => {
    it('should delete a file successfully', async () => {
      mockFileLibraryService.deleteFile.mockResolvedValue(true);

      const response = await request(app)
        .delete('/api/files/test-file-id');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('File deleted successfully');
      expect(mockFileLibraryService.deleteFile).toHaveBeenCalledWith('test-file-id');
    });

    it('should return 404 when file not found', async () => {
      mockFileLibraryService.deleteFile.mockResolvedValue(false);

      const response = await request(app)
        .delete('/api/files/nonexistent-id');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FILE_NOT_FOUND');
    });
  });

  describe('PUT /api/files/chapters/:oldName', () => {
    it('should rename a chapter successfully', async () => {
      mockFileLibraryService.renameChapter.mockResolvedValue(true);

      const response = await request(app)
        .put('/api/files/chapters/Old Chapter')
        .send({ newName: 'New Chapter' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Chapter renamed successfully');
      expect(mockFileLibraryService.renameChapter).toHaveBeenCalledWith('Old Chapter', 'New Chapter');
    });

    it('should return 404 when chapter not found', async () => {
      mockFileLibraryService.renameChapter.mockResolvedValue(false);

      const response = await request(app)
        .put('/api/files/chapters/Nonexistent Chapter')
        .send({ newName: 'New Chapter' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CHAPTER_NOT_FOUND');
    });

    it('should return error when new name is missing', async () => {
      const response = await request(app)
        .put('/api/files/chapters/Old Chapter')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_CHAPTER_NAME');
    });

    it('should handle chapter name conflict', async () => {
      mockFileLibraryService.renameChapter.mockRejectedValue(
        new Error('Chapter with the new name already exists')
      );

      const response = await request(app)
        .put('/api/files/chapters/Old Chapter')
        .send({ newName: 'Existing Chapter' });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CHAPTER_NAME_EXISTS');
    });
  });
});