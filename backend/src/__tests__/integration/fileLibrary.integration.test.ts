import request from 'supertest';
import path from 'path';
import fs from 'fs';
import app from '../../server';

/**
 * File Library Integration Tests
 * These tests verify the complete file library workflows including:
 * - File upload and organization
 * - File retrieval and management
 * - Chapter organization and renaming
 * - Integration between all file library endpoints
 */
describe('File Library Integration Tests', () => {
  const testPdfPath = path.join(__dirname, 'test-library.pdf');
  let uploadedFileId: string;
  let testChapterName: string;
  
  beforeAll(() => {
    // Create a test PDF file for integration testing
    const pdfContent = Buffer.from(
      '%PDF-1.4\n' +
      '1 0 obj\n' +
      '<<\n' +
      '/Type /Catalog\n' +
      '/Pages 2 0 R\n' +
      '>>\n' +
      'endobj\n' +
      '2 0 obj\n' +
      '<<\n' +
      '/Type /Pages\n' +
      '/Kids [3 0 R]\n' +
      '/Count 1\n' +
      '>>\n' +
      'endobj\n' +
      '3 0 obj\n' +
      '<<\n' +
      '/Type /Page\n' +
      '/Parent 2 0 R\n' +
      '/MediaBox [0 0 612 792]\n' +
      '/Contents 4 0 R\n' +
      '>>\n' +
      'endobj\n' +
      '4 0 obj\n' +
      '<<\n' +
      '/Length 44\n' +
      '>>\n' +
      'stream\n' +
      'BT\n' +
      '/F1 12 Tf\n' +
      '100 700 Td\n' +
      '(File Library Test Content) Tj\n' +
      'ET\n' +
      'endstream\n' +
      'endobj\n' +
      'xref\n' +
      '0 5\n' +
      '0000000000 65535 f \n' +
      '0000000010 00000 n \n' +
      '0000000079 00000 n \n' +
      '0000000173 00000 n \n' +
      '0000000301 00000 n \n' +
      'trailer\n' +
      '<<\n' +
      '/Size 5\n' +
      '/Root 1 0 R\n' +
      '>>\n' +
      'startxref\n' +
      '380\n' +
      '%%EOF'
    );
    fs.writeFileSync(testPdfPath, pdfContent);
    
    // Generate unique chapter name for testing
    testChapterName = `Test Chapter ${Date.now()}`;
  });

  afterAll(() => {
    // Clean up test file
    if (fs.existsSync(testPdfPath)) {
      fs.unlinkSync(testPdfPath);
    }
  });

  describe('File Upload and Organization Workflow', () => {
    it('should upload a file to the library and organize it by chapter', async () => {
      // Upload file to library
      const response = await request(app)
        .post('/api/files/upload')
        .field('chapter', testChapterName)
        .attach('file', testPdfPath)
        .expect(200);

      // Verify upload response
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('file');
      expect(response.body.file).toHaveProperty('id');
      expect(response.body.file).toHaveProperty('originalName', 'test-library.pdf');
      expect(response.body.file).toHaveProperty('chapter', testChapterName);
      expect(response.body.file).toHaveProperty('size');
      expect(response.body.file).toHaveProperty('textContent');
      expect(response.body.file).toHaveProperty('mimeType', 'application/pdf');

      // Store file ID for later tests
      uploadedFileId = response.body.file.id;

      // Verify file has content
      expect(response.body.file.textContent).toContain('File Library Test Content');
    }, 30000);

    it('should retrieve the file library with organized chapters', async () => {
      const response = await request(app)
        .get('/api/files/library')
        .expect(200);

      // Verify library response structure
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('chapters');
      expect(Array.isArray(response.body.chapters)).toBe(true);

      // Find our test chapter
      const testChapter = response.body.chapters.find(
        (chapter: any) => chapter.chapter === testChapterName
      );

      expect(testChapter).toBeDefined();
      expect(testChapter).toHaveProperty('files');
      expect(Array.isArray(testChapter.files)).toBe(true);
      expect(testChapter.files.length).toBeGreaterThan(0);

      // Verify our uploaded file is in the chapter
      const uploadedFile = testChapter.files.find(
        (file: any) => file.id === uploadedFileId
      );

      expect(uploadedFile).toBeDefined();
      expect(uploadedFile.originalName).toBe('test-library.pdf');
    });

    it('should retrieve a specific file by ID', async () => {
      const response = await request(app)
        .get(`/api/files/${uploadedFileId}`)
        .expect(200);

      // Verify file retrieval response
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('file');
      expect(response.body.file).toHaveProperty('id', uploadedFileId);
      expect(response.body.file).toHaveProperty('originalName', 'test-library.pdf');
      expect(response.body.file).toHaveProperty('chapter', testChapterName);
      expect(response.body.file).toHaveProperty('textContent');
      expect(response.body.file.textContent).toContain('File Library Test Content');
    });
  });

  describe('File Selection to Question Submission Workflow', () => {
    it('should process questions using files from the library', async () => {
      const question = 'What is the main topic of this document?';
      
      const response = await request(app)
        .post('/api/ask')
        .send({
          question: question,
          fileId: uploadedFileId
        })
        .expect(200);

      // Verify response structure
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('response');
      expect(typeof response.body.response).toBe('string');
      expect(response.body.response.length).toBeGreaterThan(0);
      expect(response.body).toHaveProperty('fileUsed', 'test-library.pdf');
    }, 30000);

    it('should handle Portuguese questions with library files', async () => {
      const question = 'Qual é o tópico principal deste documento?';
      
      const response = await request(app)
        .post('/api/ask')
        .send({
          question: question,
          fileId: uploadedFileId
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.response).toBeDefined();
      expect(typeof response.body.response).toBe('string');
    }, 30000);
  });

  describe('Chapter Management Operations', () => {
    it('should rename a chapter successfully', async () => {
      const newChapterName = `${testChapterName} - Renamed`;
      
      const response = await request(app)
        .put(`/api/files/chapters/${testChapterName}`)
        .send({ newName: newChapterName })
        .expect(200);

      // Verify rename response
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Chapter renamed successfully');

      // Verify chapter appears with new name in library
      const libraryResponse = await request(app)
        .get('/api/files/library')
        .expect(200);

      const renamedChapter = libraryResponse.body.chapters.find(
        (chapter: any) => chapter.chapter === newChapterName
      );

      expect(renamedChapter).toBeDefined();
      expect(renamedChapter.files.length).toBeGreaterThan(0);

      // Update chapter name for cleanup
      testChapterName = newChapterName;
    });

    it('should prevent renaming to an existing chapter name', async () => {
      // Create another chapter first
      const secondChapterName = `Second Chapter ${Date.now()}`;
      
      await request(app)
        .post('/api/files/upload')
        .field('chapter', secondChapterName)
        .attach('file', testPdfPath)
        .expect(200);

      // Try to rename first chapter to second chapter's name
      const response = await request(app)
        .put(`/api/files/chapters/${testChapterName}`)
        .send({ newName: secondChapterName })
        .expect(409);

      // Verify conflict response
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'CHAPTER_NAME_EXISTS');
      expect(response.body.error.message).toContain('already exists');
    });
  });

  describe('File Deletion Workflow', () => {
    it('should delete a file from the library', async () => {
      const response = await request(app)
        .delete(`/api/files/${uploadedFileId}`)
        .expect(200);

      // Verify deletion response
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'File deleted successfully');

      // Verify file is no longer retrievable
      await request(app)
        .get(`/api/files/${uploadedFileId}`)
        .expect(404);
    });

    it('should remove empty chapters after file deletion', async () => {
      // Get current library state
      const libraryResponse = await request(app)
        .get('/api/files/library')
        .expect(200);

      // Verify our renamed chapter is no longer in the library
      const testChapter = libraryResponse.body.chapters.find(
        (chapter: any) => chapter.chapter === testChapterName
      );

      // Chapter should be removed if it's empty
      expect(testChapter).toBeUndefined();
    });
  });

  describe('Cross-Component State Synchronization', () => {
    let secondFileId: string;
    const multiChapterName = `Multi-File Chapter ${Date.now()}`;

    beforeAll(async () => {
      // Upload multiple files to the same chapter
      const firstResponse = await request(app)
        .post('/api/files/upload')
        .field('chapter', multiChapterName)
        .attach('file', testPdfPath)
        .expect(200);

      const secondResponse = await request(app)
        .post('/api/files/upload')
        .field('chapter', multiChapterName)
        .attach('file', testPdfPath)
        .expect(200);

      secondFileId = secondResponse.body.file.id;
    });

    it('should maintain consistent state across all file library operations', async () => {
      // Verify chapter contains both files
      const libraryResponse = await request(app)
        .get('/api/files/library')
        .expect(200);

      const multiChapter = libraryResponse.body.chapters.find(
        (chapter: any) => chapter.chapter === multiChapterName
      );

      expect(multiChapter).toBeDefined();
      expect(multiChapter.files.length).toBe(2);

      // Delete one file
      await request(app)
        .delete(`/api/files/${secondFileId}`)
        .expect(200);

      // Verify chapter still exists with one file
      const updatedLibraryResponse = await request(app)
        .get('/api/files/library')
        .expect(200);

      const updatedChapter = updatedLibraryResponse.body.chapters.find(
        (chapter: any) => chapter.chapter === multiChapterName
      );

      expect(updatedChapter).toBeDefined();
      expect(updatedChapter.files.length).toBe(1);
    });

    afterAll(async () => {
      // Clean up remaining files in multi-file chapter
      const libraryResponse = await request(app)
        .get('/api/files/library')
        .expect(200);

      const multiChapter = libraryResponse.body.chapters.find(
        (chapter: any) => chapter.chapter === multiChapterName
      );

      if (multiChapter) {
        for (const file of multiChapter.files) {
          await request(app)
            .delete(`/api/files/${file.id}`)
            .expect(200);
        }
      }
    });
  });

  describe('Error Handling in File Library Workflows', () => {
    it('should handle requests for non-existent files gracefully', async () => {
      const response = await request(app)
        .get('/api/files/nonexistent-file-id')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'FILE_NOT_FOUND');
      expect(response.body.error.message).toContain('File not found');
    });

    it('should handle deletion of non-existent files gracefully', async () => {
      const response = await request(app)
        .delete('/api/files/nonexistent-file-id')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'FILE_NOT_FOUND');
    });

    it('should handle renaming of non-existent chapters gracefully', async () => {
      const response = await request(app)
        .put('/api/files/chapters/Nonexistent Chapter')
        .send({ newName: 'New Chapter Name' })
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'CHAPTER_NOT_FOUND');
    });

    it('should handle file upload without chapter name', async () => {
      const response = await request(app)
        .post('/api/files/upload')
        .attach('file', testPdfPath)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'MISSING_CHAPTER');
      expect(response.body.error.message).toContain('Chapter name is required');
    });
  });

  // Additional cleanup to ensure test files are removed even if tests fail
  afterEach(() => {
    // Clean up any test files that might have been created during individual tests
    const testFiles = [
      path.join(__dirname, 'test.txt'),
      path.join(__dirname, 'large.pdf')
    ];
    
    testFiles.forEach(filePath => {
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (error) {
          // Ignore cleanup errors in tests
          console.warn(`Failed to clean up test file: ${filePath}`, error);
        }
      }
    });
  });
});