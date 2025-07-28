import fs from 'fs/promises';

// Mock fs and pdf-parse before importing PDFProcessor
jest.mock('fs/promises');
jest.mock('pdf-parse', () => jest.fn());

import { PDFProcessor } from '../services/pdfProcessor';

const mockFs = fs as jest.Mocked<typeof fs>;
const mockPdfParse = require('pdf-parse') as jest.MockedFunction<any>;

describe('PDFProcessor', () => {
  const mockFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'test.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: 1024,
    destination: 'uploads/',
    filename: 'test-123.pdf',
    path: 'uploads/test-123.pdf',
    buffer: Buffer.from(''),
    stream: {} as any
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateFile', () => {
    it('should validate a valid PDF file', () => {
      expect(() => PDFProcessor.validateFile(mockFile)).not.toThrow();
    });

    it('should reject files that are too large', () => {
      const largeFile = { ...mockFile, size: 11 * 1024 * 1024 }; // 11MB
      expect(() => PDFProcessor.validateFile(largeFile)).toThrow('File size');
    });

    it('should reject non-PDF MIME types', () => {
      const txtFile = { ...mockFile, mimetype: 'text/plain' };
      expect(() => PDFProcessor.validateFile(txtFile)).toThrow('Invalid file type');
    });

    it('should reject files without .pdf extension', () => {
      const noExtFile = { ...mockFile, originalname: 'test.txt' };
      expect(() => PDFProcessor.validateFile(noExtFile)).toThrow('File must have .pdf extension');
    });
  });

  describe('extractText', () => {
    it('should extract text from PDF successfully', async () => {
      const mockBuffer = Buffer.from('mock pdf content');
      const mockPdfData = { text: 'Extracted PDF text content' };

      mockFs.readFile.mockResolvedValue(mockBuffer);
      mockPdfParse.mockResolvedValue(mockPdfData);

      const result = await PDFProcessor.extractText('test.pdf');

      expect(result).toBe('Extracted PDF text content');
      expect(mockFs.readFile).toHaveBeenCalledWith('test.pdf');
      expect(mockPdfParse).toHaveBeenCalledWith(mockBuffer);
    });

    it('should throw error when PDF has no text content', async () => {
      const mockBuffer = Buffer.from('mock pdf content');
      const mockPdfData = { text: '' };

      mockFs.readFile.mockResolvedValue(mockBuffer);
      mockPdfParse.mockResolvedValue(mockPdfData);

      await expect(PDFProcessor.extractText('test.pdf')).rejects.toThrow('No text content found');
    });

    it('should handle PDF parsing errors', async () => {
      const mockBuffer = Buffer.from('mock pdf content');

      mockFs.readFile.mockResolvedValue(mockBuffer);
      mockPdfParse.mockRejectedValue(new Error('Invalid PDF format'));

      await expect(PDFProcessor.extractText('test.pdf')).rejects.toThrow('Failed to extract text from PDF');
    });

    it('should handle file reading errors', async () => {
      mockFs.readFile.mockRejectedValue(new Error('File not found'));

      await expect(PDFProcessor.extractText('nonexistent.pdf')).rejects.toThrow('Failed to extract text from PDF');
    });
  });

  describe('processFile', () => {
    it('should process a valid PDF file successfully', async () => {
      const mockBuffer = Buffer.from('mock pdf content');
      const mockPdfData = { text: 'This is extracted PDF text content for testing purposes.' };

      mockFs.readFile.mockResolvedValue(mockBuffer);
      mockPdfParse.mockResolvedValue(mockPdfData);

      const result = await PDFProcessor.processFile(mockFile);

      expect(result).toEqual({
        originalName: 'test.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        textContent: 'This is extracted PDF text content for testing purposes.',
        extractedAt: expect.any(Date)
      });
    });

    it('should cleanup file on processing error', async () => {
      // Use a valid file that will pass validation but fail during text extraction
      const mockBuffer = Buffer.from('mock pdf content');
      mockFs.readFile.mockResolvedValue(mockBuffer);
      mockPdfParse.mockRejectedValue(new Error('PDF parsing failed'));
      mockFs.unlink.mockResolvedValue();

      await expect(PDFProcessor.processFile(mockFile)).rejects.toThrow();
      expect(mockFs.unlink).toHaveBeenCalledWith(mockFile.path);
    });
  });

  describe('cleanupFile', () => {
    it('should delete file successfully', async () => {
      mockFs.unlink.mockResolvedValue();

      await PDFProcessor.cleanupFile('test.pdf');

      expect(mockFs.unlink).toHaveBeenCalledWith('test.pdf');
    });

    it('should handle cleanup errors gracefully', async () => {
      mockFs.unlink.mockRejectedValue(new Error('Permission denied'));
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await PDFProcessor.cleanupFile('test.pdf');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to cleanup file test.pdf:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('validateTextContent', () => {
    it('should validate good text content', () => {
      const goodText = 'This is a good PDF text content with readable characters.';
      expect(() => PDFProcessor.validateTextContent(goodText)).not.toThrow();
    });

    it('should reject text that is too short', () => {
      const shortText = 'Short';
      expect(() => PDFProcessor.validateTextContent(shortText)).toThrow('Text content too short');
    });

    it('should reject text that is too long', () => {
      const longText = 'a'.repeat(1000001);
      expect(() => PDFProcessor.validateTextContent(longText)).toThrow('Text content too long');
    });

    it('should reject text with low readability ratio', () => {
      const unreadableText = '§¶•ªº∆∑∏π∫ªº∆∑∏π∫ªº∆∑∏π∫ªº∆∑∏π∫ªº∆∑∏π∫';
      expect(() => PDFProcessor.validateTextContent(unreadableText)).toThrow('mostly non-readable content');
    });
  });
});