import { Request } from 'express';
import { ErrorService } from '../services/errorService';
import { ServiceError } from '../types';

// Mock uuid
jest.mock('uuid', () => ({
  v4: () => 'test-uuid-123'
}));

describe('ErrorService', () => {
  describe('createError', () => {
    it('should create a service error with correct properties', () => {
      const error = ErrorService.createError('MISSING_FILE', 'Custom message');

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('ServiceError');
      expect(error.code).toBe('MISSING_FILE');
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Custom message');
      expect(error.userMessage).toEqual({
        en: 'PDF file is required. Please upload a file.',
        pt: 'Arquivo PDF é obrigatório. Envie um arquivo.'
      });
      expect(error.retryable).toBe(false);
    });

    it('should use default message if none provided', () => {
      const error = ErrorService.createError('RATE_LIMIT_EXCEEDED');

      expect(error.message).toContain('RATE_LIMIT_EXCEEDED');
      expect(error.statusCode).toBe(429);
      expect(error.retryable).toBe(true);
    });

    it('should throw error for unknown error code', () => {
      expect(() => {
        ErrorService.createError('UNKNOWN_CODE' as any);
      }).toThrow('Unknown error code: UNKNOWN_CODE');
    });
  });

  describe('createErrorContext', () => {
    it('should create error context from request', () => {
      const mockReq = {
        get: jest.fn().mockReturnValue('Mozilla/5.0'),
        ip: '127.0.0.1',
        connection: { remoteAddress: '192.168.1.1' },
        method: 'POST',
        path: '/api/ask'
      } as unknown as Request;

      const context = ErrorService.createErrorContext(mockReq);

      expect(context.requestId).toBe('test-uuid-123');
      expect(context.timestamp).toBeDefined();
      expect(context.userAgent).toBe('Mozilla/5.0');
      expect(context.ip).toBe('127.0.0.1');
      expect(context.endpoint).toBe('POST /api/ask');
    });

    it('should handle missing IP address', () => {
      const mockReq = {
        get: jest.fn().mockReturnValue('Mozilla/5.0'),
        ip: undefined,
        connection: { remoteAddress: '192.168.1.1' },
        method: 'GET',
        path: '/health'
      } as unknown as Request;

      const context = ErrorService.createErrorContext(mockReq);

      expect(context.ip).toBe('192.168.1.1');
    });
  });

  describe('formatErrorResponse', () => {
    const mockContext = {
      requestId: 'test-uuid-123',
      timestamp: '2024-01-01T00:00:00.000Z',
      userAgent: 'Mozilla/5.0',
      ip: '127.0.0.1',
      endpoint: 'POST /api/ask'
    };

    it('should format service error response correctly', () => {
      const serviceError = ErrorService.createError('MISSING_FILE', 'File not provided');
      const response = ErrorService.formatErrorResponse(serviceError, mockContext, 'en');

      expect(response.success).toBe(false);
      expect(response.error.code).toBe('MISSING_FILE');
      expect(response.error.message).toBe('PDF file is required. Please upload a file.');
      expect(response.error.timestamp).toBe('2024-01-01T00:00:00.000Z');
      expect(response.error.requestId).toBe('test-uuid-123');
    });

    it('should format service error response in Portuguese', () => {
      const serviceError = ErrorService.createError('FILE_TOO_LARGE');
      const response = ErrorService.formatErrorResponse(serviceError, mockContext, 'pt');

      expect(response.error.message).toBe('Arquivo muito grande. Envie um arquivo PDF menor (máx 10MB).');
    });

    it('should format generic error response', () => {
      const genericError = new Error('Something went wrong');
      const response = ErrorService.formatErrorResponse(genericError, mockContext, 'en');

      expect(response.success).toBe(false);
      expect(response.error.code).toBe('INTERNAL_SERVER_ERROR');
      expect(response.error.message).toBe('An unexpected error occurred. Please try again.');
    });

    it('should include debug details in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const serviceError = ErrorService.createError('PDF_PROCESSING_ERROR', 'PDF parse failed');
      serviceError.details = { pdfSize: 1024 };
      
      const response = ErrorService.formatErrorResponse(serviceError, mockContext, 'en');

      expect(response.error.details).toBeDefined();
      expect(response.error.details.originalMessage).toBe('PDF parse failed');
      expect(response.error.details.pdfSize).toBe(1024);

      process.env.NODE_ENV = originalEnv;
    });

    it('should not include debug details in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const serviceError = ErrorService.createError('PDF_PROCESSING_ERROR', 'PDF parse failed');
      const response = ErrorService.formatErrorResponse(serviceError, mockContext, 'en');

      expect(response.error.details).toBeUndefined();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('isServiceError', () => {
    it('should return true for service errors', () => {
      const serviceError = ErrorService.createError('MISSING_FILE');
      expect(ErrorService.isServiceError(serviceError)).toBe(true);
    });

    it('should return false for generic errors', () => {
      const genericError = new Error('Generic error');
      expect(ErrorService.isServiceError(genericError)).toBe(false);
    });
  });

  describe('getStatusCode', () => {
    it('should return correct status code for service errors', () => {
      const serviceError = ErrorService.createError('RATE_LIMIT_EXCEEDED');
      expect(ErrorService.getStatusCode(serviceError)).toBe(429);
    });

    it('should return 400 for validation errors', () => {
      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';
      expect(ErrorService.getStatusCode(validationError)).toBe(400);
    });

    it('should return 404 for not found errors', () => {
      const notFoundError = new Error('Resource not found');
      expect(ErrorService.getStatusCode(notFoundError)).toBe(404);
    });

    it('should return 408 for timeout errors', () => {
      const timeoutError = new Error('Request timeout');
      expect(ErrorService.getStatusCode(timeoutError)).toBe(408);
    });

    it('should return 429 for rate limit errors', () => {
      const rateLimitError = new Error('Rate limit exceeded');
      expect(ErrorService.getStatusCode(rateLimitError)).toBe(429);
    });

    it('should return 500 for unknown errors', () => {
      const unknownError = new Error('Unknown error');
      expect(ErrorService.getStatusCode(unknownError)).toBe(500);
    });
  });

  describe('detectLanguage', () => {
    it('should detect Portuguese from Accept-Language header', () => {
      const mockReq = {
        get: jest.fn().mockReturnValue('pt-BR,pt;q=0.9,en;q=0.8')
      } as unknown as Request;

      const language = ErrorService.detectLanguage(mockReq);
      expect(language).toBe('pt');
    });

    it('should detect Portuguese from pt-PT', () => {
      const mockReq = {
        get: jest.fn().mockReturnValue('pt-PT,en;q=0.8')
      } as unknown as Request;

      const language = ErrorService.detectLanguage(mockReq);
      expect(language).toBe('pt');
    });

    it('should default to English for other languages', () => {
      const mockReq = {
        get: jest.fn().mockReturnValue('en-US,en;q=0.9')
      } as unknown as Request;

      const language = ErrorService.detectLanguage(mockReq);
      expect(language).toBe('en');
    });

    it('should default to English when no Accept-Language header', () => {
      const mockReq = {
        get: jest.fn().mockReturnValue(undefined)
      } as unknown as Request;

      const language = ErrorService.detectLanguage(mockReq);
      expect(language).toBe('en');
    });
  });

  describe('validateFileUpload', () => {
    it('should throw error when no file provided', () => {
      expect(() => {
        ErrorService.validateFileUpload(undefined);
      }).toThrow();
    });

    it('should throw error for file too large', () => {
      const largeFile = {
        size: 11 * 1024 * 1024, // 11MB
        mimetype: 'application/pdf',
        originalname: 'test.pdf'
      } as Express.Multer.File;

      expect(() => {
        ErrorService.validateFileUpload(largeFile);
      }).toThrow();
    });

    it('should throw error for invalid MIME type', () => {
      const invalidFile = {
        size: 1024,
        mimetype: 'text/plain',
        originalname: 'test.txt'
      } as Express.Multer.File;

      expect(() => {
        ErrorService.validateFileUpload(invalidFile);
      }).toThrow();
    });

    it('should throw error for invalid file extension', () => {
      const invalidFile = {
        size: 1024,
        mimetype: 'application/pdf',
        originalname: 'test.txt'
      } as Express.Multer.File;

      expect(() => {
        ErrorService.validateFileUpload(invalidFile);
      }).toThrow();
    });

    it('should pass validation for valid PDF file', () => {
      const validFile = {
        size: 1024,
        mimetype: 'application/pdf',
        originalname: 'test.pdf'
      } as Express.Multer.File;

      expect(() => {
        ErrorService.validateFileUpload(validFile);
      }).not.toThrow();
    });
  });

  describe('validateQuestion', () => {
    it('should throw error for missing question', () => {
      expect(() => {
        ErrorService.validateQuestion(undefined);
      }).toThrow();

      expect(() => {
        ErrorService.validateQuestion(null);
      }).toThrow();
    });

    it('should throw error for non-string question', () => {
      expect(() => {
        ErrorService.validateQuestion(123);
      }).toThrow();

      expect(() => {
        ErrorService.validateQuestion({});
      }).toThrow();
    });

    it('should throw error for empty question', () => {
      expect(() => {
        ErrorService.validateQuestion('');
      }).toThrow();

      expect(() => {
        ErrorService.validateQuestion('   ');
      }).toThrow();
    });

    it('should throw error for question too long', () => {
      const longQuestion = 'a'.repeat(1001);
      expect(() => {
        ErrorService.validateQuestion(longQuestion);
      }).toThrow();
    });

    it('should pass validation for valid question', () => {
      expect(() => {
        ErrorService.validateQuestion('What is this document about?');
      }).not.toThrow();
    });
  });

  describe('logError', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      // Mock all console methods since the service uses different log levels
      consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      jest.spyOn(console, 'warn').mockImplementation();
      jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
      jest.restoreAllMocks();
    });

    it('should log error with context', () => {
      const error = ErrorService.createError('MISSING_FILE');
      const context = {
        requestId: 'test-uuid',
        timestamp: '2024-01-01T00:00:00.000Z',
        userAgent: 'Mozilla/5.0',
        ip: '127.0.0.1',
        endpoint: 'POST /api/ask'
      };

      ErrorService.logError(error, context);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: '2024-01-01T00:00:00.000Z',
          requestId: 'test-uuid',
          endpoint: 'POST /api/ask',
          error: expect.objectContaining({
            name: 'ServiceError',
            code: 'MISSING_FILE',
            statusCode: 400
          }),
          context: expect.objectContaining({
            userAgent: 'Mozilla/5.0',
            ip: '127.0.0.1'
          })
        })
      );
    });
  });
});