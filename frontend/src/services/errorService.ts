import { EnhancedError, ErrorSeverity, NetworkError } from '../types';

export class ErrorService {
  private static readonly ERROR_MESSAGES = {
    // Network errors
    NETWORK_ERROR: {
      en: 'Network connection failed. Please check your internet connection and try again.',
      pt: 'Falha na conexão de rede. Verifique sua conexão com a internet e tente novamente.'
    },
    TIMEOUT_ERROR: {
      en: 'Request timed out. Please try again with a smaller file or simpler question.',
      pt: 'Tempo limite excedido. Tente novamente com um arquivo menor ou pergunta mais simples.'
    },
    SERVER_ERROR: {
      en: 'Server error occurred. Please try again later.',
      pt: 'Erro no servidor. Tente novamente mais tarde.'
    },
    SERVICE_UNAVAILABLE: {
      en: 'Service temporarily unavailable. Please try again later.',
      pt: 'Serviço temporariamente indisponível. Tente novamente mais tarde.'
    },

    // File errors
    FILE_TOO_LARGE: {
      en: 'File is too large. Please upload a smaller PDF file (max 10MB).',
      pt: 'Arquivo muito grande. Envie um arquivo PDF menor (máx 10MB).'
    },
    INVALID_FILE_TYPE: {
      en: 'Invalid file type. Please upload a PDF file only.',
      pt: 'Tipo de arquivo inválido. Envie apenas arquivos PDF.'
    },
    FILE_PROCESSING_ERROR: {
      en: 'Unable to process the PDF file. Please ensure it contains readable text.',
      pt: 'Não foi possível processar o arquivo PDF. Certifique-se de que contém texto legível.'
    },
    MISSING_FILE: {
      en: 'Please upload a PDF file before asking a question.',
      pt: 'Envie um arquivo PDF antes de fazer uma pergunta.'
    },

    // Question errors
    MISSING_QUESTION: {
      en: 'Please enter a question before submitting.',
      pt: 'Digite uma pergunta antes de enviar.'
    },
    INVALID_QUESTION: {
      en: 'Please enter a valid question.',
      pt: 'Digite uma pergunta válida.'
    },

    // API errors
    RATE_LIMIT_EXCEEDED: {
      en: 'Too many requests. Please wait a moment and try again.',
      pt: 'Muitas solicitações. Aguarde um momento e tente novamente.'
    },
    API_KEY_ERROR: {
      en: 'Service configuration error. Please try again later.',
      pt: 'Erro de configuração do serviço. Tente novamente mais tarde.'
    },
    AI_GENERATION_ERROR: {
      en: 'Failed to generate response. Please try again.',
      pt: 'Falha ao gerar resposta. Tente novamente.'
    },

    // Generic errors
    UNKNOWN_ERROR: {
      en: 'An unexpected error occurred. Please try again.',
      pt: 'Ocorreu um erro inesperado. Tente novamente.'
    },
    VALIDATION_ERROR: {
      en: 'Invalid request. Please check your input and try again.',
      pt: 'Solicitação inválida. Verifique sua entrada e tente novamente.'
    }
  };

  /**
   * Processes an error and returns an enhanced error object
   */
  static processError(error: any, language: 'en' | 'pt' = 'en'): EnhancedError {
    const timestamp = new Date().toISOString();
    
    // Handle network errors
    if (this.isNetworkError(error)) {
      return this.createNetworkError(error, language, timestamp);
    }

    // Handle API response errors
    if (this.isAPIError(error)) {
      return this.createAPIError(error, language, timestamp);
    }

    // Handle validation errors
    if (this.isValidationError(error)) {
      return this.createValidationError(error, language, timestamp);
    }

    // Default to unknown error
    return this.createUnknownError(error, language, timestamp);
  }

  /**
   * Checks if error is a network error
   */
  private static isNetworkError(error: any): boolean {
    return error.code === 'ECONNABORTED' || 
           error.code === 'NETWORK_ERROR' ||
           error.message?.includes('Network Error') ||
           !error.response && error.request;
  }

  /**
   * Checks if error is an API response error
   */
  private static isAPIError(error: any): boolean {
    return error.response && error.response.status;
  }

  /**
   * Checks if error is a validation error
   */
  private static isValidationError(error: any): boolean {
    return error.name === 'ValidationError' ||
           error.code === 'VALIDATION_ERROR';
  }

  /**
   * Creates a network error object
   */
  private static createNetworkError(error: any, language: 'en' | 'pt', timestamp: string): EnhancedError {
    let code = 'NETWORK_ERROR';
    let severity: ErrorSeverity = 'medium';

    if (error.code === 'ECONNABORTED') {
      code = 'TIMEOUT_ERROR';
      severity = 'high';
    }

    return {
      code,
      message: error.message || 'Network error',
      severity,
      userMessage: this.ERROR_MESSAGES[code as keyof typeof this.ERROR_MESSAGES] || this.ERROR_MESSAGES.NETWORK_ERROR,
      retryable: true,
      timestamp
    };
  }

  /**
   * Creates an API error object
   */
  private static createAPIError(error: any, language: 'en' | 'pt', timestamp: string): EnhancedError {
    const status = error.response.status;
    const responseData = error.response.data;
    
    let code = 'SERVER_ERROR';
    let severity: ErrorSeverity = 'medium';
    let retryable = true;

    // Map HTTP status codes to error types
    switch (status) {
      case 400:
        code = this.mapBadRequestError(responseData);
        severity = 'low';
        retryable = false;
        break;
      case 413:
        code = 'FILE_TOO_LARGE';
        severity = 'low';
        retryable = false;
        break;
      case 429:
        code = 'RATE_LIMIT_EXCEEDED';
        severity = 'medium';
        retryable = true;
        break;
      case 500:
        code = 'SERVER_ERROR';
        severity = 'high';
        retryable = true;
        break;
      case 502:
      case 503:
      case 504:
        code = 'SERVICE_UNAVAILABLE';
        severity = 'high';
        retryable = true;
        break;
      default:
        code = 'SERVER_ERROR';
        severity = 'medium';
        retryable = true;
    }

    const userMessage = this.ERROR_MESSAGES[code as keyof typeof this.ERROR_MESSAGES] || this.ERROR_MESSAGES.SERVER_ERROR;

    return {
      code,
      message: responseData?.error?.message || error.message || `HTTP ${status}`,
      severity,
      userMessage,
      retryable,
      timestamp
    };
  }

  /**
   * Maps bad request errors to specific error codes
   */
  private static mapBadRequestError(responseData: any): string {
    if (!responseData?.error?.code) {
      return 'VALIDATION_ERROR';
    }

    const errorCode = responseData.error.code;
    
    switch (errorCode) {
      case 'MISSING_FILE':
        return 'MISSING_FILE';
      case 'MISSING_QUESTION':
        return 'MISSING_QUESTION';
      case 'INVALID_FILE':
        return 'INVALID_FILE_TYPE';
      case 'PDF_PROCESSING_ERROR':
        return 'FILE_PROCESSING_ERROR';
      case 'INVALID_CONTENT':
        return 'FILE_PROCESSING_ERROR';
      default:
        return 'VALIDATION_ERROR';
    }
  }

  /**
   * Creates a validation error object
   */
  private static createValidationError(error: any, language: 'en' | 'pt', timestamp: string): EnhancedError {
    return {
      code: 'VALIDATION_ERROR',
      message: error.message || 'Validation error',
      severity: 'low',
      userMessage: this.ERROR_MESSAGES.VALIDATION_ERROR,
      retryable: false,
      timestamp
    };
  }

  /**
   * Creates an unknown error object
   */
  private static createUnknownError(error: any, language: 'en' | 'pt', timestamp: string): EnhancedError {
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'Unknown error',
      severity: 'medium',
      userMessage: this.ERROR_MESSAGES.UNKNOWN_ERROR,
      retryable: true,
      timestamp
    };
  }

  /**
   * Gets user-friendly error message in the specified language
   */
  static getUserMessage(error: EnhancedError, language: 'en' | 'pt' = 'en'): string {
    return error.userMessage[language];
  }

  /**
   * Determines if an error is retryable
   */
  static isRetryable(error: EnhancedError): boolean {
    return error.retryable;
  }

  /**
   * Gets error severity level
   */
  static getSeverity(error: EnhancedError): ErrorSeverity {
    return error.severity;
  }

  /**
   * Logs error for debugging (development only)
   */
  static logError(error: EnhancedError, context?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error [${error.severity.toUpperCase()}]: ${error.code}`);
      console.error('Message:', error.message);
      console.error('User Message (EN):', error.userMessage.en);
      console.error('User Message (PT):', error.userMessage.pt);
      console.error('Retryable:', error.retryable);
      console.error('Timestamp:', error.timestamp);
      if (context) {
        console.error('Context:', context);
      }
      console.groupEnd();
    }
  }
}