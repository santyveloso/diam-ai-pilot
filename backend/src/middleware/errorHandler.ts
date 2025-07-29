import { Request, Response, NextFunction } from 'express';
import { ErrorService } from '../services/errorService';

// Global error handler middleware
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Create error context
  const context = ErrorService.createErrorContext(req);
  
  // Detect language preference
  const language = ErrorService.detectLanguage(req);
  
  // Log the error
  ErrorService.logError(error, context, {
    body: req.body,
    params: req.params,
    query: req.query
  });

  // Handle Multer errors (file upload errors)
  if (error.code === 'LIMIT_FILE_SIZE') {
    const serviceError = ErrorService.createError('FILE_TOO_LARGE');
    const errorResponse = ErrorService.formatErrorResponse(serviceError, context, language);
    return res.status(serviceError.statusCode).json(errorResponse);
  }

  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    const serviceError = ErrorService.createError('INVALID_FILE_TYPE', 'Unexpected file field');
    const errorResponse = ErrorService.formatErrorResponse(serviceError, context, language);
    return res.status(serviceError.statusCode).json(errorResponse);
  }

  // Handle service errors
  if (ErrorService.isServiceError(error)) {
    const errorResponse = ErrorService.formatErrorResponse(error, context, language);
    return res.status(error.statusCode).json(errorResponse);
  }

  // Handle specific Node.js errors
  if (error.code === 'ENOENT') {
    const serviceError = ErrorService.createError('NOT_FOUND', 'File not found');
    const errorResponse = ErrorService.formatErrorResponse(serviceError, context, language);
    return res.status(serviceError.statusCode).json(errorResponse);
  }

  if (error.name === 'ValidationError') {
    const serviceError = ErrorService.createError('VALIDATION_ERROR', error.message);
    const errorResponse = ErrorService.formatErrorResponse(serviceError, context, language);
    return res.status(serviceError.statusCode).json(errorResponse);
  }

  // Handle timeout errors
  if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
    const serviceError = ErrorService.createError('AI_GENERATION_ERROR', 'Request timeout');
    const errorResponse = ErrorService.formatErrorResponse(serviceError, context, language);
    return res.status(serviceError.statusCode).json(errorResponse);
  }

  // Default to internal server error
  const serviceError = ErrorService.createError('INTERNAL_SERVER_ERROR', error.message);
  const errorResponse = ErrorService.formatErrorResponse(serviceError, context, language);
  res.status(serviceError.statusCode).json(errorResponse);
};

// 404 handler for undefined routes
export const notFoundHandler = (req: Request, res: Response) => {
  const context = ErrorService.createErrorContext(req);
  const language = ErrorService.detectLanguage(req);
  const serviceError = ErrorService.createError('NOT_FOUND', `Route ${req.method} ${req.path} not found`);
  const errorResponse = ErrorService.formatErrorResponse(serviceError, context, language);
  
  res.status(serviceError.statusCode).json(errorResponse);
};

// Multer error handler middleware
export const handleMulterError = (error: any, req: Request, res: Response, next: NextFunction) => {
  if (error) {
    // Pass Multer errors to the main error handler
    return errorHandler(error, req, res, next);
  }
  next();
};