/**
 * File Library Integration Tests
 * End-to-end tests for complete file library workflows
 */

import request from 'supertest';
import app from '../server';
import { FileLibraryService } from '../services/fileLibraryService';

// Mock Google Auth middleware
jest.mock('../middleware/googleAuth', () => ({
  verifyGoogleToken: (req: any, _res: any, next: any) => {
    req.user = { id: 'test-user', email: 'test@iscte.pt' };
    next();
  }
}));

// Mock PDF processor
jest.mock('../services/pdfProcessor', () => ({
  PDFProcessor: {
    processFile: jest.fn().mockImplementation((file) => Promise.resolve({
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      textContent: `Extracted text from ${file.originalname}`,
      extractedAt: new Date()
    })),
    validateTextContent: jest.fn(),
    cleanupFile: jest.fn().mockResolvedValue(undefined)
  }
}));

// Mock Gemini client
jest.mock('../services/geminiClient', () => ({
  GeminiClient: jest.fn().mockImplementation(() => ({
    createQuestionContext: jest.fn().mockReturnValue({
      question: 'test question',
      context: 'test context',
      language: 'pt'
    }),
    generateResponse: jest.fn().mockResolvedValue({
      answer: 'Test AI response',
      processingTime: 100
    })
  }))
}));

describe('File Library Integration Tests', () => {
  beforeEach(async () => {
    // Clear library before each test
    await FileLibraryService.clearLibrary();
  });

  describe('Complete File Upload and Organization Workflow', () => {
    it('should handle complete file upload workflow', async () => {
      // Step 1: Upload first file to new chapter
      const uploadResponse1 = await request(app)
        .post('/api/files/upload')
        .field('chapter', 'Chapter 1')
        .attach('file', Buffer.from('fake pdf content 1'), 'document1.pdf');

      expect(uploadResponse1.status).toBe(200);
      expect(uploadResponse1.body.success).toBe(true);
      expect(uploadResponse1.body.file.chapter).toBe('Chapter 1');
      expect(uploadResponse1.body.file.originalName).toBe('document1.pdf');

      const fileId1 = uploadResponse1.body.file.id;

      // Step 2: Upload second file to same chapter
      const uploadResponse2 = await request(app)
        .post('/api/files/upload')
        .field('chapter', 'Chapter 1')
        .attach('file', Buffer.from('fake pdf content 2'), 'document2.pdf');

      expect(uploadResponse2.status).toBe(200);
      expect(uploadResponse2.body.file.chapter).toBe('Chapter 1');

      // Step 3: Upload third file to different chapter
      const uploadResponse3 = await request(app)
        .post('/api/files/upload')
        .field('chapter', 'Chapter 2')
        .attach('file', Buffer.from('fake pdf content 3'), 'document3.pdf');

      expect(uploadResponse3.status).toBe(200);
      expect(uploadResponse3.body.file.chapter).toBe('Chapter 2');

      // Step 4: Verify library organization
      const libraryResponse = await request(app)
        .get('/api/files/library');

      expect(libraryResponse.status).toBe(200);
      expect(libraryResponse.body.success).toBe(true);
      expect(libraryResponse.body.chapters).toHaveLength(2);

      const chapter1 = libraryResponse.body.chapters.find((c: any) => c.chapter === 'Chapter 1');
      const chapter2 = libraryResponse.body.chapters.find((c: any) => c.chapter === 'Chapter 2');

      expect(chapter1.files).toHaveLength(2);
      expect(chapter2.files).toHaveLength(1);

      // Step 5: Verify individual file retrieval
      const fileResponse = await request(app)
        .get(`/api/files/${fileId1}`);

      expect(fileResponse.status).toBe(200);
      expect(fileResponse.body.success).toBe(true);
      expect(fileResponse.body.file.originalName).toBe('document1.pdf');
    });

    it('should handle file upload with validation errors', async () => {
      // Test missing chapter
      const response1 = await request(app)
        .post('/api/files/upload')
        .attach('file', Buffer.from('fake pdf content'), 'test.pdf');

      expect(response1.status).toBe(400);
      expect(response1.body.success).toBe(false);
      expect(response1.body.error.code).toBe('MISSING_CHAPTER');

      // Test missing file
      const response2 = await request(app)
        .post('/api/files/upload')
        .field('chapter', 'Test Chapter');

      expect(response2.status).toBe(400);
      expect(response2.body.success).toBe(false);
    });
  });

  describe('File Selection to Question Submission Workflow', () => {
    it('should handle complete question workflow with file library', async () => {
      // Step 1: Upload a file
      const uploadResponse = await request(app)
        .post('/api/files/upload')
        .field('chapter', 'Test Chapter')
        .attach('file', Buffer.from('fake pdf content'), 'test-document.pdf');

      expect(uploadResponse.status).toBe(200);
      const fileId = uploadResponse.body.file.id;

      // Step 2: Ask question using file ID
      const questionResponse = await request(app)
        .post('/api/ask')
        .send({
          question: 'What is the main topic of this document?',
          fileId: fileId
        });

      expect(questionResponse.status).toBe(200);
      expect(questionResponse.body.success).toBe(true);
      expect(questionResponse.body.response).toBe('Test AI response');
      expect(questionResponse.body.fileUsed).toBe('test-document.pdf');
    });

    it('should handle question with invalid file ID', async () => {
      const response = await request(app)
        .post('/api/ask')
        .send({
          question: 'Test question',
          fileId: 'invalid-file-id'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FILE_NOT_FOUND');
    });

    it('should maintain backward compatibility with file upload', async () => {
      const response = await request(app)
        .post('/api/ask')
        .field('question', 'What is this document about?')
        .attach('file', Buffer.from('fake pdf content'), 'uploaded.pdf');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.response).toBe('Test AI response');
      expect(response.body.fileUsed).toBe('uploaded.pdf');
    });
  });

  describe('Chapter Management Operations Workflow', () => {
    it('should handle complete chapter management workflow', async () => {
      // Step 1: Upload files to create chapters
      await request(app)
        .post('/api/files/upload')
        .field('chapter', 'Original Chapter')
        .attach('file', Buffer.from('content 1'), 'file1.pdf');

      await request(app)
        .post('/api/files/upload')
        .field('chapter', 'Original Chapter')
        .attach('file', Buffer.from('content 2'), 'file2.pdf');

      // Step 2: Verify initial state
      let libraryResponse = await request(app)
        .get('/api/files/library');

      expect(libraryResponse.body.chapters).toHaveLength(1);
      expect(libraryResponse.body.chapters[0].chapter).toBe('Original Chapter');
      expect(libraryResponse.body.chapters[0].files).toHaveLength(2);

      // Step 3: Rename chapter
      const renameResponse = await request(app)
        .put('/api/files/chapters/Original Chapter')
        .send({ newName: 'Renamed Chapter' });

      expect(renameResponse.status).toBe(200);
      expect(renameResponse.body.success).toBe(true);

      // Step 4: Verify chapter was renamed
      libraryResponse = await request(app)
        .get('/api/files/library');

      expect(libraryResponse.body.chapters[0].chapter).toBe('Renamed Chapter');
      expect(libraryResponse.body.chapters[0].files).toHaveLength(2);

      // Step 5: Delete one file
      const fileId = libraryResponse.body.chapters[0].files[0].id;
      const deleteResponse = await request(app)
        .delete(`/api/files/${fileId}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.success).toBe(true);

      // Step 6: Verify file was deleted
      libraryResponse = await request(app)
        .get('/api/files/library');

      expect(libraryResponse.body.chapters[0].files).toHaveLength(1);

      // Step 7: Delete remaining file (should remove empty chapter)
      const remainingFileId = libraryResponse.body.chapters[0].files[0].id;
      await request(app)
        .delete(`/api/files/${remainingFileId}`);

      // Step 8: Verify chapter was removed
      libraryResponse = await request(app)
        .get('/api/files/library');

      expect(libraryResponse.body.chapters).toHaveLength(0);
    });

    it('should handle chapter rename conflicts', async () => {
      // Create two chapters
      await request(app)
        .post('/api/files/upload')
        .field('chapter', 'Chapter A')
        .attach('file', Buffer.from('content'), 'file1.pdf');

      await request(app)
        .post('/api/files/upload')
        .field('chapter', 'Chapter B')
        .attach('file', Buffer.from('content'), 'file2.pdf');

      // Try to rename Chapter A to Chapter B (should fail)
      const response = await request(app)
        .put('/api/files/chapters/Chapter A')
        .send({ newName: 'Chapter B' });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CHAPTER_NAME_EXISTS');
    });
  });

  describe('Cross-Component State Synchronization', () => {
    it('should maintain consistency across all operations', async () => {
      // Step 1: Create initial state
      const upload1 = await request(app)
        .post('/api/files/upload')
        .field('chapter', 'Sync Test')
        .attach('file', Buffer.from('content 1'), 'sync1.pdf');

      const upload2 = await request(app)
        .post('/api/files/upload')
        .field('chapter', 'Sync Test')
        .attach('file', Buffer.from('content 2'), 'sync2.pdf');

      const fileId1 = upload1.body.file.id;
      const fileId2 = upload2.body.file.id;

      // Step 2: Verify library state
      let library = await request(app).get('/api/files/library');
      expect(library.body.chapters[0].files).toHaveLength(2);

      // Step 3: Use file in question (should not affect library)
      await request(app)
        .post('/api/ask')
        .send({
          question: 'Test question',
          fileId: fileId1
        });

      // Step 4: Verify library unchanged
      library = await request(app).get('/api/files/library');
      expect(library.body.chapters[0].files).toHaveLength(2);

      // Step 5: Delete file and verify consistency
      await request(app).delete(`/api/files/${fileId1}`);

      // Verify file is gone from library
      library = await request(app).get('/api/files/library');
      expect(library.body.chapters[0].files).toHaveLength(1);
      expect(library.body.chapters[0].files[0].id).toBe(fileId2);

      // Verify deleted file cannot be accessed
      const fileResponse = await request(app).get(`/api/files/${fileId1}`);
      expect(fileResponse.status).toBe(404);

      // Verify deleted file cannot be used in questions
      const questionResponse = await request(app)
        .post('/api/ask')
        .send({
          question: 'Test question',
          fileId: fileId1
        });

      expect(questionResponse.status).toBe(400);
      expect(questionResponse.body.error.code).toBe('FILE_NOT_FOUND');
    });
  });

  describe('Error Recovery and Edge Cases', () => {
    it('should handle concurrent operations gracefully', async () => {
      // Upload multiple files concurrently
      const uploads = await Promise.all([
        request(app)
          .post('/api/files/upload')
          .field('chapter', 'Concurrent Test')
          .attach('file', Buffer.from('content 1'), 'concurrent1.pdf'),
        request(app)
          .post('/api/files/upload')
          .field('chapter', 'Concurrent Test')
          .attach('file', Buffer.from('content 2'), 'concurrent2.pdf'),
        request(app)
          .post('/api/files/upload')
          .field('chapter', 'Concurrent Test')
          .attach('file', Buffer.from('content 3'), 'concurrent3.pdf')
      ]);

      // All uploads should succeed
      uploads.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      // Verify all files are in library
      const library = await request(app).get('/api/files/library');
      expect(library.body.chapters[0].files).toHaveLength(3);
    });

    it('should handle invalid operations gracefully', async () => {
      // Try to delete non-existent file
      const deleteResponse = await request(app)
        .delete('/api/files/non-existent-id');
      expect(deleteResponse.status).toBe(404);

      // Try to rename non-existent chapter
      const renameResponse = await request(app)
        .put('/api/files/chapters/Non-existent Chapter')
        .send({ newName: 'New Name' });
      expect(renameResponse.status).toBe(404);

      // Try to get non-existent file
      const getResponse = await request(app)
        .get('/api/files/non-existent-id');
      expect(getResponse.status).toBe(404);

      // All should return proper error responses
      [deleteResponse, renameResponse, getResponse].forEach(response => {
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
      });
    });
  });
});