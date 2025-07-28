import { Request, Response, NextFunction } from 'express';
import { ErrorResponse } from '../types';

// Global error handler middleware
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', error);

  // Default error response
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred'
    }
  };

  // Handle specific error types
  if (error.name === 'ValidationError') {
    errorResponse.error.code = 'VALIDATION_ERROR';
    errorResponse.error.message = error.message;
    return res.status(400).json(errorResponse);
  }

  if (error.code === 'ENOENT') {
    errorResponse.error.code = 'FILE_NOT_FOUND';
    errorResponse.error.message = 'File not found';
    return res.status(404).json(errorResponse);
  }

  // Send generic error response
  res.status(500).json(errorResponse);
};

// 404 handler for undefined routes
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`
    }
  });
};