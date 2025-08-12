import express from 'express';
import { corsMiddleware } from './middleware/cors';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { handleMulterError } from './middleware/upload';
import { requestIdMiddleware, performanceMiddleware, errorTrackingMiddleware } from './middleware/monitoring';
import apiRoutes from './routes/api';
import authRoutes from './routes/auth';
import { env, validateEnvironment, logEnvironmentInfo } from './config/environment';
import { logger } from './services/logger';

// Validate environment configuration
validateEnvironment();

const app = express();
const PORT = env.port;

// Basic middleware
app.use(corsMiddleware);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Monitoring middleware
app.use(requestIdMiddleware);
app.use(performanceMiddleware);

// Request timeout middleware
app.use((req, res, next) => {
  res.setTimeout(env.requestTimeout, () => {
    logger.error('Request timeout', {
      method: req.method,
      path: req.path,
      timeout: `${env.requestTimeout}ms`
    }, req.requestId);
    
    if (!res.headersSent) {
      res.status(408).json({
        success: false,
        error: {
          code: 'REQUEST_TIMEOUT',
          message: 'Request timeout'
        }
      });
    }
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'DIAM AI Pilot Backend is running',
    timestamp: new Date().toISOString(),
    environment: env.nodeEnv,
    version: '1.0.0',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    geminiConfigured: !!env.geminiApiKey
  });
});

// API routes
app.use('/api', apiRoutes);
app.use('/auth', authRoutes);

// Multer error handling middleware
app.use(handleMulterError);

// 404 handler for undefined routes
app.use(notFoundHandler);

// Error tracking middleware
app.use(errorTrackingMiddleware);

// Global error handler (must be last)
app.use(errorHandler);

// Start server only if not in test environment
if (env.nodeEnv !== 'test') {
  app.listen(PORT, () => {
    logger.info('🚀 DIAM AI Pilot Backend started successfully');
    logEnvironmentInfo();
    logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
    logger.info(`📊 API endpoint: http://localhost:${PORT}/api`);
  });
}

export default app;