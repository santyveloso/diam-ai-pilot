import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../services/logger';
import { env } from '../config/environment';

// Extend Request interface to include monitoring data
declare global {
  namespace Express {
    interface Request {
      requestId: string;
      startTime: number;
    }
  }
}

// Request ID middleware
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  req.requestId = uuidv4();
  res.setHeader('X-Request-ID', req.requestId);
  next();
};

// Performance monitoring middleware
export const performanceMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  req.startTime = Date.now();
  
  // Log request start
  if (env.enableRequestLogging) {
    logger.info(`Request started: ${req.method} ${req.path}`, {
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      contentLength: req.get('Content-Length')
    }, req.requestId);
  }

  // Monitor response
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - req.startTime;
    
    if (env.enablePerformanceMonitoring) {
      logger.logRequest(req.method, req.path, res.statusCode, duration, req.requestId);
      
      // Log slow requests
      if (duration > 5000) { // 5 seconds
        logger.warn(`Slow request detected`, {
          method: req.method,
          path: req.path,
          duration: `${duration}ms`,
          statusCode: res.statusCode
        }, req.requestId);
      }
    }
    
    return originalSend.call(this, data);
  };

  next();
};

// Memory monitoring
export const logMemoryUsage = (): void => {
  const usage = process.memoryUsage();
  logger.info('Memory Usage', {
    rss: `${(usage.rss / 1024 / 1024).toFixed(2)}MB`,
    heapTotal: `${(usage.heapTotal / 1024 / 1024).toFixed(2)}MB`,
    heapUsed: `${(usage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
    external: `${(usage.external / 1024 / 1024).toFixed(2)}MB`
  });
};

// Start memory monitoring if enabled
if (env.enablePerformanceMonitoring && env.nodeEnv !== 'test') {
  // Log memory usage every 5 minutes
  setInterval(logMemoryUsage, 5 * 60 * 1000);
}

// Error tracking
export const errorTrackingMiddleware = (error: Error, req: Request, res: Response, next: NextFunction): void => {
  logger.error('Unhandled error', {
    error: error.message,
    stack: error.stack,
    method: req.method,
    path: req.path,
    body: req.body,
    query: req.query
  }, req.requestId);
  
  next(error);
};