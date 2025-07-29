import { Request } from 'express';
import { ServiceError, ErrorResponse, ErrorContext, ErrorSeverity } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class ErrorService {
  private static readonly ERROR_DEFINITIONS = {
    // File processing errors
    INVALID_FILE_TYPE: {
      statusCode: 400,
      userMessage: {
        en: 'Invalid file type. Please upload a PDF file only.',
        pt: 'Tipo de arquivo inválido. Envie apenas arquivos PDF.'
      },
      retryable: false,
      severity: 'low' as ErrorSeverity
    },
    FILE_TOO_LARGE: {
      statusCode: 413,
      userMessage: {
        en: 'File is too large. Please upload a smaller PDF file (max 10MB).',
        pt: 'Arquivo muito grande. Envie um arquivo PDF menor (máx 10MB).'
      },
      retryable: false,
      severity: 'low' as ErrorSeverity
    },
    PDF_PROCESSING_ERROR: {
      statusCode: 400,
      userMessage: {
        en: 'Unable to extract text from PDF. Please ensure the PDF contains readable text.',
        pt: 'Não foi possível extrair texto do PDF. Certifique-se de que o PDF contém texto legível.'
      },
      retryable: false,
      severity: 'medium' as ErrorSeverity
    },
    INVALID_CONTENT: {
      statusCode: 400,
      userMessage: {
        en: 'PDF content is invalid or too short. Please upload a document with more content.',
        pt: 'Conteúdo do PDF é inválido ou muito curto. Envie um documento com mais conteúdo.'
      },
      retryable: false,
      severity: 'low' as ErrorSeverity
    },

    // Request validation errors
    MISSING_FILE: {
      statusCode: 400,
      userMessage: {
        en: 'PDF file is required. Please upload a file.',
        pt: 'Arquivo PDF é obrigatório. Envie um arquivo.'
      },
      retryable: false,
      severity: 'low' as ErrorSeverity
    },
    MISSING_QUESTION: {
      statusCode: 400,
      userMessage: {
        en: 'Question is required and cannot be empty.',
        pt: 'Pergunta é obrigatória e não pode estar vazia.'
      },
      retryable: false,
      severity: 'low' as ErrorSeverity
    },
    INVALID_QUESTION: {
      statusCode: 400,
      userMessage: {
        en: 'Question must be a valid text string.',
        pt: 'Pergunta deve ser um texto válido.'
      },
      retryable: false,
      severity: 'low' as ErrorSeverity
    },

    // AI service errors
    API_CONFIGURATION_ERROR: {
      statusCode: 500,
      userMessage: {
        en: 'AI service configuration error. Please try again later.',
        pt: 'Erro de configuração do serviço de IA. Tente novamente mais tarde.'
      },
      retryable: true,
      severity: 'critical' as ErrorSeverity
    },
    RATE_LIMIT_EXCEEDED: {
      statusCode: 429,
      userMessage: {
        en: 'Service temporarily unavailable due to high demand. Please try again later.',
        pt: 'Serviço temporariamente indisponível devido à alta demanda. Tente novamente mais tarde.'
      },
      retryable: true,
      severity: 'medium' as ErrorSeverity
    },
    AI_GENERATION_ERROR: {
      statusCode: 500,
      userMessage: {
        en: 'Failed to generate AI response. Please try again.',
        pt: 'Falha ao gerar resposta da IA. Tente novamente.'
      },
      retryable: true,
      severity: 'high' as ErrorSeverity
    },

    // Generic errors
    VALIDATION_ERROR: {
      statusCode: 400,
      userMessage: {
        en: 'Invalid request data. Please check your input.',
        pt: 'Dados de solicitação inválidos. Verifique sua entrada.'
      },
      retryable: false,
      severity: 'low' as ErrorSeverity
    },
    INTERNAL_SERVER_ERROR: {
      statusCode: 500,
      userMessage: {
        en: 'An unexpected error occurred. Please try again.',
        pt: 'Ocorreu um erro inesperado. Tente novamente.'
      },
      retryable: true,
      severity: 'high' as ErrorSeverity
    },
    NOT_FOUND: {
      statusCode: 404,
      userMessage: {
        en: 'The requested resource was not found.',
        pt: 'O recurso solicitado não foi encontrado.'
      },
      retryable: false,
      severity: 'low' as ErrorSeverity
    }
  };

  /**
   * Creates a service error with enhanced information
   */
  static createError(
    code: keyof typeof ErrorService.ERROR_DEFINITIONS,
    message?: string,
    details?: any
  ): ServiceError {
    const definition = this.ERROR_DEFINITIONS[code];
    
    if (!definition) {
      throw new Error(`Unknown error code: ${code}`);
    }

    const error = new Error(message || `${code}: ${definition.userMessage.en}`) as ServiceError;
    error.name = 'ServiceError';
    error.code = code;
    error.statusCode = definition.statusCode;
    error.userMessage = definition.userMessage;
    error.retryable = definition.retryable;
    error.details = details;

    return error;
  }

  /**
   * Creates error context from request
   */
  static createErrorContext(req: Request): ErrorContext {
    return {
      requestId: uuidv4(),
      timestamp: new Date().toISOString(),
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      endpoint: `${req.method} ${req.path}`
    };
  }

  /**
   * Formats error response for API
   */
  static formatErrorResponse(
    error: ServiceError | Error,
    context: ErrorContext,
    language: 'en' | 'pt' = 'en'
  ): ErrorResponse {
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'An unexpected error occurred';
    let userMessage = this.ERROR_DEFINITIONS.INTERNAL_SERVER_ERROR.userMessage[language];

    if (this.isServiceError(error)) {
      code = error.code;
      message = error.message;
      if (error.userMessage) {
        userMessage = error.userMessage[language];
      }
    }

    return {
      success: false,
      error: {
        code,
        message: userMessage,
        details: process.env.NODE_ENV === 'development' ? {
          originalMessage: message,
          stack: error.stack,
          ...((error as ServiceError).details || {})
        } : undefined,
        timestamp: context.timestamp,
        requestId: context.requestId
      }
    };
  }

  /**
   * Checks if error is a ServiceError
   */
  static isServiceError(error: any): error is ServiceError {
    return error instanceof Error && 
           error.name === 'ServiceError' && 
           'code' in error && 
           'statusCode' in error;
  }

  /**
   * Gets HTTP status code for error
   */
  static getStatusCode(error: ServiceError | Error): number {
    if (this.isServiceError(error)) {
      return error.statusCode;
    }

    // Default status codes for common error types
    if (error.name === 'ValidationError') {
      return 400;
    }
    if (error.message.includes('not found')) {
      return 404;
    }
    if (error.message.includes('timeout')) {
      return 408;
    }
    if (error.message.includes('rate limit') || error.message.includes('Rate limit')) {
      return 429;
    }

    return 500; // Default to internal server error
  }

  /**
   * Logs error with context
   */
  static logError(
    error: ServiceError | Error,
    context: ErrorContext,
    additionalInfo?: any
  ): void {
    const severity = this.isServiceError(error) ? 
      (this.ERROR_DEFINITIONS[error.code as keyof typeof this.ERROR_DEFINITIONS]?.severity || 'medium') : 
      'medium';

    const logLevel = this.getLogLevel(severity);
    const logMethod = console[logLevel] || console.error;

    logMethod.call(console, {
      timestamp: context.timestamp,
      requestId: context.requestId,
      endpoint: context.endpoint,
      error: {
        name: error.name,
        message: error.message,
        code: this.isServiceError(error) ? error.code : 'UNKNOWN',
        statusCode: this.getStatusCode(error),
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      context: {
        userAgent: context.userAgent,
        ip: context.ip
      },
      additionalInfo
    });
  }

  /**
   * Gets appropriate log level for error severity
   */
  private static getLogLevel(severity: ErrorSeverity): 'log' | 'warn' | 'error' {
    switch (severity) {
      case 'low':
        return 'log';
      case 'medium':
        return 'warn';
      case 'high':
      case 'critical':
        return 'error';
      default:
        return 'error';
    }
  }

  /**
   * Detects language from request headers
   */
  static detectLanguage(req: Request): 'en' | 'pt' {
    const acceptLanguage = req.get('Accept-Language') || '';
    
    // Check for Portuguese language indicators
    if (acceptLanguage.includes('pt') || 
        acceptLanguage.includes('pt-BR') || 
        acceptLanguage.includes('pt-PT')) {
      return 'pt';
    }

    return 'en'; // Default to English
  }

  /**
   * Validates file upload
   */
  static validateFileUpload(file?: Express.Multer.File): void {
    if (!file) {
      throw this.createError('MISSING_FILE');
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw this.createError('FILE_TOO_LARGE', 
        `File size ${file.size} exceeds maximum allowed size of ${maxSize} bytes`);
    }

    // Check MIME type
    if (file.mimetype !== 'application/pdf') {
      throw this.createError('INVALID_FILE_TYPE', 
        `Invalid file type: ${file.mimetype}. Only PDF files are allowed.`);
    }

    // Check file extension
    if (!file.originalname.toLowerCase().endsWith('.pdf')) {
      throw this.createError('INVALID_FILE_TYPE', 
        'File must have .pdf extension');
    }
  }

  /**
   * Validates question input
   */
  static validateQuestion(question: any): void {
    if (!question) {
      throw this.createError('MISSING_QUESTION');
    }

    if (typeof question !== 'string') {
      throw this.createError('INVALID_QUESTION', 
        'Question must be a string');
    }

    if (question.trim().length === 0) {
      throw this.createError('MISSING_QUESTION', 
        'Question cannot be empty');
    }

    if (question.length > 1000) {
      throw this.createError('INVALID_QUESTION', 
        'Question is too long (max 1000 characters)');
    }
  }
}