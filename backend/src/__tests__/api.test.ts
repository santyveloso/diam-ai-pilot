import request from 'supertest';
import path from 'path';
import fs from 'fs';

// Mock the services before importing the app
jest.mock('../services/geminiClient', () => {
  return {
    GeminiClient: jest.fn().mockImplementation(() => ({
      createQuestionContext: jest.fn().mockReturnValue({
        question: 'test question',
        documentContent: 'test content',
        timestamp: new Date(),
        language: 'en'
      }),
      generateResponse: jest.fn().mockResolvedValue({
        answer: 'This is a test response from the AI.',
        processingTime: 1000,
        confidence: 0.8,
        sources: ['Document content provided by user']
      }),
      healthCheck: jest.fn().mockResolvedValue(true)
    }))
  };
});

jest.mock('../services/pdfProcessor', () => {
  return {
    PDFProcessor: {
      processFile: jest.fn().mockResolvedValue({
        originalName: 'test.pdf',
        mimeType: 'application/pdf',
        size: 1000,
        textContent: 'This is test content from a PDF document.',
        extractedAt: new Date()
      }),
      validateTextContent: jest.fn(),
      cleanupFile: jest.fn().mockResolvedValue(undefined)
    }
  };
});

// Import app after mocking
import app from '../server';

describe('API Routes', () => {
  // Create a test PDF file for testing
  const testPdfPath = path.join(__dirname, 'test.pdf');
  
  beforeAll(() => {
    // Create a minimal PDF file for testing
    // This is a very basic PDF structure - in real tests you'd use a proper PDF
    const pdfContent = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000010 00000 n \n0000000079 00000 n \n0000000173 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n301\n%%EOF');
    fs.writeFileSync(testPdfPath, pdfContent);
  });

  afterAll(() => {
    // Clean up test file
    if (fs.existsSync(testPdfPath)) {
      fs.unlinkSync(testPdfPath);
    }
  });

  describe('POST /api/ask', () => {
    it('should return 400 when no question is provided', async () => {
      const response = await request(app)
        .post('/api/ask')
        .attach('file', testPdfPath)
        .field('question', '');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_QUESTION');
    });

    it('should return 400 when no file is provided', async () => {
      const response = await request(app)
        .post('/api/ask')
        .field('question', 'What is this document about?');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_FILE');
    });

    it('should return 400 when non-PDF file is uploaded', async () => {
      // Create a text file for testing
      const textFilePath = path.join(__dirname, 'test.txt');
      fs.writeFileSync(textFilePath, 'This is a test text file');

      const response = await request(app)
        .post('/api/ask')
        .attach('file', textFilePath)
        .field('question', 'What is this document about?');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_FILE_TYPE');

      // Clean up
      fs.unlinkSync(textFilePath);
    });

    it('should process valid request successfully', async () => {
      const response = await request(app)
        .post('/api/ask')
        .attach('file', testPdfPath)
        .field('question', 'What is this document about?');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.response).toBe('This is a test response from the AI.');
    });
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('OK');
      expect(response.body.services.gemini).toBe('healthy');
    });
  });
});