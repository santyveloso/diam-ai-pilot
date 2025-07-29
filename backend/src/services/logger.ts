import { env } from '../config/environment';

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  data?: any;
  requestId?: string;
}

class Logger {
  private logLevel: LogLevel;

  constructor() {
    this.logLevel = this.getLogLevelFromEnv(env.logLevel);
  }

  private getLogLevelFromEnv(level: string): LogLevel {
    switch (level.toLowerCase()) {
      case 'error': return LogLevel.ERROR;
      case 'warn': return LogLevel.WARN;
      case 'info': return LogLevel.INFO;
      case 'debug': return LogLevel.DEBUG;
      default: return LogLevel.INFO;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  private formatLog(level: string, message: string, data?: any, requestId?: string): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      requestId
    };
  }

  private writeLog(logEntry: LogEntry): void {
    const logString = env.nodeEnv === 'production' 
      ? JSON.stringify(logEntry)
      : `[${logEntry.timestamp}] ${logEntry.level.padEnd(5)} ${logEntry.message}${logEntry.data ? ` | ${JSON.stringify(logEntry.data)}` : ''}${logEntry.requestId ? ` | RequestID: ${logEntry.requestId}` : ''}`;
    
    console.log(logString);
  }

  error(message: string, data?: any, requestId?: string): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.writeLog(this.formatLog('ERROR', message, data, requestId));
    }
  }

  warn(message: string, data?: any, requestId?: string): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.writeLog(this.formatLog('WARN', message, data, requestId));
    }
  }

  info(message: string, data?: any, requestId?: string): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.writeLog(this.formatLog('INFO', message, data, requestId));
    }
  }

  debug(message: string, data?: any, requestId?: string): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.writeLog(this.formatLog('DEBUG', message, data, requestId));
    }
  }

  // Performance monitoring
  startTimer(label: string, requestId?: string): () => void {
    const start = Date.now();
    this.debug(`Timer started: ${label}`, undefined, requestId);
    
    return () => {
      const duration = Date.now() - start;
      this.info(`Timer completed: ${label}`, { duration: `${duration}ms` }, requestId);
    };
  }

  // Request logging
  logRequest(method: string, path: string, statusCode: number, duration: number, requestId?: string): void {
    const level = statusCode >= 400 ? 'ERROR' : statusCode >= 300 ? 'WARN' : 'INFO';
    const message = `${method} ${path} - ${statusCode}`;
    const data = { duration: `${duration}ms`, statusCode };

    switch (level) {
      case 'ERROR':
        this.error(message, data, requestId);
        break;
      case 'WARN':
        this.warn(message, data, requestId);
        break;
      default:
        this.info(message, data, requestId);
    }
  }

  // API specific logging
  logApiCall(endpoint: string, success: boolean, duration: number, requestId?: string, error?: any): void {
    const message = `API Call: ${endpoint}`;
    const data = { 
      success, 
      duration: `${duration}ms`,
      ...(error && { error: error.message || error })
    };

    if (success) {
      this.info(message, data, requestId);
    } else {
      this.error(message, data, requestId);
    }
  }

  // File processing logging
  logFileProcessing(filename: string, size: number, success: boolean, duration: number, requestId?: string, error?: any): void {
    const message = `File Processing: ${filename}`;
    const data = { 
      size: `${(size / 1024 / 1024).toFixed(2)}MB`, 
      success, 
      duration: `${duration}ms`,
      ...(error && { error: error.message || error })
    };

    if (success) {
      this.info(message, data, requestId);
    } else {
      this.error(message, data, requestId);
    }
  }
}

export const logger = new Logger();