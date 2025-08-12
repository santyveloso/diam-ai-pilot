import fs from 'fs/promises';
import { ProcessedFile } from '../types';
import { ErrorService } from './errorService';

// Dynamic import for pdf-parse to avoid test issues
const pdfParse = require('pdf-parse');

export class PDFProcessor {
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly ALLOWED_MIME_TYPES = ['application/pdf'];

  /**
   * Validates PDF file before processing
   */
  static validateFile(file: Express.Multer.File): void {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      throw ErrorService.createError('FILE_TOO_LARGE', 
        `File size ${file.size} exceeds maximum allowed size of ${this.MAX_FILE_SIZE} bytes`);
    }

    // Check MIME type
    if (!this.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw ErrorService.createError('INVALID_FILE_TYPE', 
        `Invalid file type: ${file.mimetype}. Only PDF files are allowed.`);
    }

    // Check file extension
    if (!file.originalname.toLowerCase().endsWith('.pdf')) {
      throw ErrorService.createError('INVALID_FILE_TYPE', 
        'File must have .pdf extension');
    }
  }

  /**
   * Extracts text content from PDF file
   */
  static async extractText(filePath: string): Promise<string> {
    try {
      // Validate file path to prevent directory traversal
      const path = require('path');
      const uploadDir = path.resolve('uploads/');
      const resolvedPath = path.resolve(filePath);
      
      if (!resolvedPath.startsWith(uploadDir)) {
        throw ErrorService.createError('INVALID_FILE_PATH', 
          'File path is not within allowed directory');
      }

      // Read the PDF file
      const dataBuffer = await fs.readFile(resolvedPath);
      
      // Parse PDF and extract text
      const pdfData = await pdfParse(dataBuffer);
      
      if (!pdfData.text || pdfData.text.trim().length === 0) {
        throw ErrorService.createError('PDF_PROCESSING_ERROR', 
          'No text content found in PDF file');
      }

      return pdfData.text.trim();
    } catch (error) {
      if (ErrorService.isServiceError(error)) {
        throw error;
      }
      
      if (error instanceof Error) {
        throw ErrorService.createError('PDF_PROCESSING_ERROR', 
          `Failed to extract text from PDF: ${error.message}`);
      }
      
      throw ErrorService.createError('PDF_PROCESSING_ERROR', 
        'Failed to extract text from PDF: Unknown error');
    }
  }

  /**
   * Processes uploaded PDF file and returns processed file info
   */
  static async processFile(file: Express.Multer.File): Promise<ProcessedFile> {
    // Validate file first
    this.validateFile(file);

    try {
      // Extract text content
      const textContent = await this.extractText(file.path);

      // Create processed file object
      const processedFile: ProcessedFile = {
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        textContent,
        extractedAt: new Date()
      };

      return processedFile;
    } catch (error) {
      // Clean up uploaded file on error
      await this.cleanupFile(file.path);
      throw error;
    }
  }

  /**
   * Cleans up temporary uploaded file with retry logic
   */
  static async cleanupFile(filePath: string, retries: number = 3): Promise<void> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await fs.unlink(filePath);
        return; // Success, exit early
      } catch (error: any) {
        if (error.code === 'ENOENT') {
          // File doesn't exist, consider it cleaned up
          return;
        }
        
        if (attempt === retries) {
          console.error(`Failed to cleanup file ${filePath} after ${retries} attempts:`, error);
        } else {
          console.warn(`Cleanup attempt ${attempt} failed for ${filePath}, retrying...`);
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
        }
      }
    }
  }

  /**
   * Validates text content length and quality
   */
  static validateTextContent(text: string): void {
    const minLength = 10; // Minimum 10 characters
    const maxLength = 1000000; // Maximum 1MB of text

    if (text.length < minLength) {
      throw ErrorService.createError('INVALID_CONTENT', 
        `Text content too short. Minimum ${minLength} characters required.`);
    }

    if (text.length > maxLength) {
      throw ErrorService.createError('INVALID_CONTENT', 
        `Text content too long. Maximum ${maxLength} characters allowed.`);
    }

    // Check if text contains mostly readable characters
    const readableChars = text.match(/[a-zA-Z0-9\s.,!?;:()\-]/g);
    const readableRatio = readableChars ? readableChars.length / text.length : 0;

    if (readableRatio < 0.7) {
      throw ErrorService.createError('PDF_PROCESSING_ERROR', 
        'PDF appears to contain mostly non-readable content. Please ensure the PDF contains extractable text.');
    }
  }
}