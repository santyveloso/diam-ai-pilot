import { ErrorService } from '../errorService';
import { EnhancedError } from '../../types';

describe('ErrorService', () => {
  describe('processError', () => {
    it('should handle network errors correctly', () => {
      const networkError = {
        code: 'ECONNABORTED',
        message: 'timeout of 30000ms exceeded'
      };

      const result = ErrorService.processError(networkError, 'en');

      expect(result.code).toBe('TIMEOUT_ERROR');
      expect(result.severity).toBe('high');
      expect(result.retryable).toBe(true);
      expect(result.userMessage.en).toContain('timed out');
      expect(result.userMessage.pt).toContain('Tempo limite');
    });

    it('should handle API response errors correctly', () => {
      const apiError = {
        response: {
          status: 400,
          data: {
            error: {
              code: 'MISSING_FILE',
              message: 'PDF file is required'
            }
          }
        }
      };

      const result = ErrorService.processError(apiError, 'pt');

      expect(result.code).toBe('MISSING_FILE');
      expect(result.severity).toBe('low');
      expect(result.retryable).toBe(false);
      expect(result.userMessage.pt).toContain('arquivo PDF');
    });

    it('should handle rate limit errors correctly', () => {
      const rateLimitError = {
        response: {
          status: 429,
          data: {
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: 'Too many requests'
            }
          }
        }
      };

      const result = ErrorService.processError(rateLimitError, 'en');

      expect(result.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(result.severity).toBe('medium');
      expect(result.retryable).toBe(true);
      expect(result.userMessage.en).toContain('Too many requests');
    });

    it('should handle file too large errors correctly', () => {
      const fileTooLargeError = {
        response: {
          status: 413,
          data: {
            error: {
              code: 'FILE_TOO_LARGE',
              message: 'File is too large'
            }
          }
        }
      };

      const result = ErrorService.processError(fileTooLargeError, 'pt');

      expect(result.code).toBe('FILE_TOO_LARGE');
      expect(result.severity).toBe('low');
      expect(result.retryable).toBe(false);
      expect(result.userMessage.pt).toContain('muito grande');
    });

    it('should handle server errors correctly', () => {
      const serverError = {
        response: {
          status: 500,
          data: {
            error: {
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Internal server error'
            }
          }
        }
      };

      const result = ErrorService.processError(serverError, 'en');

      expect(result.code).toBe('SERVER_ERROR');
      expect(result.severity).toBe('high');
      expect(result.retryable).toBe(true);
      expect(result.userMessage.en).toContain('Server error');
    });

    it('should handle service unavailable errors correctly', () => {
      const serviceUnavailableError = {
        response: {
          status: 503,
          data: {
            error: {
              code: 'SERVICE_UNAVAILABLE',
              message: 'Service unavailable'
            }
          }
        }
      };

      const result = ErrorService.processError(serviceUnavailableError, 'en');

      expect(result.code).toBe('SERVICE_UNAVAILABLE');
      expect(result.severity).toBe('high');
      expect(result.retryable).toBe(true);
      expect(result.userMessage.en).toContain('temporarily unavailable');
    });

    it('should handle validation errors correctly', () => {
      const validationError = {
        name: 'ValidationError',
        message: 'Invalid input'
      };

      const result = ErrorService.processError(validationError, 'en');

      expect(result.code).toBe('VALIDATION_ERROR');
      expect(result.severity).toBe('low');
      expect(result.retryable).toBe(false);
      expect(result.userMessage.en).toContain('Invalid request');
    });

    it('should handle unknown errors correctly', () => {
      const unknownError = {
        message: 'Something went wrong'
      };

      const result = ErrorService.processError(unknownError, 'en');

      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.severity).toBe('medium');
      expect(result.retryable).toBe(true);
      expect(result.userMessage.en).toContain('unexpected error');
    });

    it('should include timestamp in error object', () => {
      const error = { message: 'test error' };
      const result = ErrorService.processError(error, 'en');

      expect(result.timestamp).toBeDefined();
      expect(new Date(result.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('getUserMessage', () => {
    it('should return English message when language is en', () => {
      const error: EnhancedError = {
        code: 'NETWORK_ERROR',
        message: 'Network failed',
        severity: 'medium',
        userMessage: {
          en: 'Network connection failed',
          pt: 'Falha na conexão de rede'
        },
        retryable: true,
        timestamp: new Date().toISOString()
      };

      const message = ErrorService.getUserMessage(error, 'en');
      expect(message).toBe('Network connection failed');
    });

    it('should return Portuguese message when language is pt', () => {
      const error: EnhancedError = {
        code: 'NETWORK_ERROR',
        message: 'Network failed',
        severity: 'medium',
        userMessage: {
          en: 'Network connection failed',
          pt: 'Falha na conexão de rede'
        },
        retryable: true,
        timestamp: new Date().toISOString()
      };

      const message = ErrorService.getUserMessage(error, 'pt');
      expect(message).toBe('Falha na conexão de rede');
    });
  });

  describe('isRetryable', () => {
    it('should return true for retryable errors', () => {
      const error: EnhancedError = {
        code: 'NETWORK_ERROR',
        message: 'Network failed',
        severity: 'medium',
        userMessage: { en: 'Error', pt: 'Erro' },
        retryable: true,
        timestamp: new Date().toISOString()
      };

      expect(ErrorService.isRetryable(error)).toBe(true);
    });

    it('should return false for non-retryable errors', () => {
      const error: EnhancedError = {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        severity: 'low',
        userMessage: { en: 'Error', pt: 'Erro' },
        retryable: false,
        timestamp: new Date().toISOString()
      };

      expect(ErrorService.isRetryable(error)).toBe(false);
    });
  });

  describe('getSeverity', () => {
    it('should return correct severity level', () => {
      const error: EnhancedError = {
        code: 'SERVER_ERROR',
        message: 'Server failed',
        severity: 'high',
        userMessage: { en: 'Error', pt: 'Erro' },
        retryable: true,
        timestamp: new Date().toISOString()
      };

      expect(ErrorService.getSeverity(error)).toBe('high');
    });
  });

  describe('logError', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'group').mockImplementation();
      jest.spyOn(console, 'error').mockImplementation();
      jest.spyOn(console, 'groupEnd').mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should log error in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error: EnhancedError = {
        code: 'TEST_ERROR',
        message: 'Test error',
        severity: 'medium',
        userMessage: { en: 'Test', pt: 'Teste' },
        retryable: true,
        timestamp: new Date().toISOString()
      };

      ErrorService.logError(error);

      expect(consoleSpy).toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });

    it('should not log error in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error: EnhancedError = {
        code: 'TEST_ERROR',
        message: 'Test error',
        severity: 'medium',
        userMessage: { en: 'Test', pt: 'Teste' },
        retryable: true,
        timestamp: new Date().toISOString()
      };

      ErrorService.logError(error);

      expect(consoleSpy).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });
  });
});