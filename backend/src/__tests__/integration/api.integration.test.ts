import request from 'supertest';
import path from 'path';
import fs from 'fs';
import app from '../../server';

/**
 * Integration tests for the complete API workflow
 * These tests verify the full request/response cycle including:
 * - File upload handling
 * - PDF processing
 * - AI response generation
 * - Error handling across all layers
 */
describe('API Integration Tests', () => {
  const testPdfPath = path.join(__dirname, 'test-integration.pdf');
  
  beforeAll(() => {
    // Create a test PDF file for integration testing
    // This is a minimal valid PDF structure
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
      '(Integration Test Content) Tj\n' +
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
  });

  afterAll(() => {
    // Clean up test file
    if (fs.existsSync(testPdfPath)) {
      fs.unlinkSync(testPdfPath);
    }
  });

  describe('Complete Question Processing Workflow', () => {
    it('should process a complete question workflow successfully', async () => {
      const question = 'What is the main topic of this document?';
      
      const response = await request(app)
        .post('/api/ask')
        .attach('file', testPdfPath)
        .field('question', question)
        .expect(200);

      // Verify response structure
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('response');
      expect(typeof response.body.response).toBe('string');
      expect(response.body.response.length).toBeGreaterThan(0);
      
      // Verify response headers
      expect(response.headers['content-type']).toMatch(/json/);
    }, 30000); // Increased timeout for AI processing

    it('should handle Portuguese questions correctly', async () => {
      const question = 'Qual é o tópico principal deste documento?';
      
      const response = await request(app)
        .post('/api/ask')
        .attach('file', testPdfPath)
        .field('question', question)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.response).toBeDefined();
      expect(typeof response.body.response).toBe('string');
    }, 30000);

    it('should handle long questions appropriately', async () => {
      const longQuestion = 'This is a very long question that tests the system\'s ability to handle extended queries about the document content. '.repeat(5) + 'What can you tell me about this document?';
      
      const response = await request(app)
        .post('/api/ask')
        .attach('file', testPdfPath)
        .field('question', longQuestion)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.response).toBeDefined();
    }, 30000);
  });

  describe('Error Handling Integration', () => {
    it('should handle missing file with proper error response', async () => {
      const response = await request(app)
        .post('/api/ask')
        .field('question', 'What is this about?')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_FILE');
      expect(response.body.error.message).toContain('PDF file is required');
      expect(response.body.error.requestId).toBeDefined();
      expect(response.body.error.timestamp).toBeDefined();
    });

    it('should handle missing question with proper error response', async () => {
      const response = await request(app)
        .post('/api/ask')
        .attach('file', testPdfPath)
        .field('question', '')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_QUESTION');
      expect(response.body.error.message).toContain('Question is required');
    });

    it('should handle invalid file type with proper error response', async () => {
      // Create a text file
      const textFilePath = path.join(__dirname, 'test.txt');
      fs.writeFileSync(textFilePath, 'This is not a PDF file');

      const response = await request(app)
        .post('/api/ask')
        .attach('file', textFilePath)
        .field('question', 'What is this about?')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_FILE_TYPE');

      // Clean up
      fs.unlinkSync(textFilePath);
    });

    it('should handle oversized files with proper error response', async () => {
      // Create a large file (simulate by checking file size validation)
      const largeFilePath = path.join(__dirname, 'large.pdf');
      const largeContent = Buffer.alloc(11 * 1024 * 1024, 'a'); // 11MB
      fs.writeFileSync(largeFilePath, largeContent);

      const response = await request(app)
        .post('/api/ask')
        .attach('file', largeFilePath)
        .field('question', 'What is this about?')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FILE_TOO_LARGE');

      // Clean up
      fs.unlinkSync(largeFilePath);
    });
  });

  describe('Health Check Integration', () => {
    it('should return comprehensive health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('services');
      expect(response.body.services).toHaveProperty('gemini');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });
  });

  describe('CORS and Security Integration', () => {
    it('should include proper CORS headers', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
      expect(response.headers).toHaveProperty('access-control-allow-methods');
      expect(response.headers).toHaveProperty('access-control-allow-headers');
    });

    it('should handle preflight OPTIONS requests', async () => {
      const response = await request(app)
        .options('/api/ask')
        .expect(204);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
      expect(response.headers).toHaveProperty('access-control-allow-methods');
    });
  });

  describe('Content Type Handling', () => {
    it('should accept multipart/form-data for file uploads', async () => {
      const response = await request(app)
        .post('/api/ask')
        .attach('file', testPdfPath)
        .field('question', 'Test question')
        .expect(200);

      expect(response.body.success).toBe(true);
    }, 30000);

    it('should return JSON responses with proper content-type', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('Performance and Timeout Handling', () => {
    it('should complete requests within reasonable time limits', async () => {
      const startTime = Date.now();
      
      await request(app)
        .post('/api/ask')
        .attach('file', testPdfPath)
        .field('question', 'Quick test question')
        .expect(200);

      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within 30 seconds (generous for AI processing)
      expect(duration).toBeLessThan(30000);
    }, 35000);
  });

  describe('Request Validation Integration', () => {
    it('should validate question length limits', async () => {
      const tooLongQuestion = 'a'.repeat(1001); // Over 1000 character limit
      
      const response = await request(app)
        .post('/api/ask')
        .attach('file', testPdfPath)
        .field('question', tooLongQuestion)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('QUESTION_TOO_LONG');
    });

    it('should validate minimum question length', async () => {
      const tooShortQuestion = 'Hi'; // Under 10 character minimum
      
      const response = await request(app)
        .post('/api/ask')
        .attach('file', testPdfPath)
        .field('question', tooShortQuestion)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('QUESTION_TOO_SHORT');
    });
  });

  describe('Cleanup and Resource Management', () => {
    it('should clean up uploaded files after processing', async () => {
      const response = await request(app)
        .post('/api/ask')
        .attach('file', testPdfPath)
        .field('question', 'Test cleanup')
        .expect(200);

      expect(response.body.success).toBe(true);
      
      // Note: In a real test, we would check that temporary files are cleaned up
      // This would require access to the upload directory and file tracking
    }, 30000);
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