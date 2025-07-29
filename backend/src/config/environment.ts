import { config } from 'dotenv';
import path from 'path';

// Load environment variables from .env file
config({ path: path.join(__dirname, '../../.env') });

export interface EnvironmentConfig {
  port: number;
  nodeEnv: string;
  frontendUrl: string;
  geminiApiKey: string;
  maxFileSize: number;
  uploadDir: string;
  logLevel: string;
  enableRequestLogging: boolean;
  enablePerformanceMonitoring: boolean;
  requestTimeout: number;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
}

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = process.env[key];
  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${key} is required but not set`);
  }
  return value || defaultValue!;
};

const getEnvNumber = (key: string, defaultValue: number): number => {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a valid number`);
  }
  return parsed;
};

const getEnvBoolean = (key: string, defaultValue: boolean): boolean => {
  const value = process.env[key];
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
};

export const env: EnvironmentConfig = {
  port: getEnvNumber('PORT', 3001),
  nodeEnv: getEnvVar('NODE_ENV', 'development'),
  frontendUrl: getEnvVar('FRONTEND_URL', 'http://localhost:3000'),
  geminiApiKey: getEnvVar('GEMINI_API_KEY', process.env.NODE_ENV === 'test' ? 'test-key' : ''),
  maxFileSize: getEnvNumber('MAX_FILE_SIZE', 10485760), // 10MB
  uploadDir: getEnvVar('UPLOAD_DIR', 'uploads/'),
  logLevel: getEnvVar('LOG_LEVEL', 'info'),
  enableRequestLogging: getEnvBoolean('ENABLE_REQUEST_LOGGING', true),
  enablePerformanceMonitoring: getEnvBoolean('ENABLE_PERFORMANCE_MONITORING', true),
  requestTimeout: getEnvNumber('REQUEST_TIMEOUT', 30000),
  rateLimitWindowMs: getEnvNumber('RATE_LIMIT_WINDOW_MS', 900000), // 15 minutes
  rateLimitMaxRequests: getEnvNumber('RATE_LIMIT_MAX_REQUESTS', 100),
};

// Validate critical environment variables
export const validateEnvironment = (): void => {
  const errors: string[] = [];

  if (!env.geminiApiKey && env.nodeEnv !== 'test') {
    errors.push('GEMINI_API_KEY is required for non-test environments');
  }

  if (env.maxFileSize <= 0) {
    errors.push('MAX_FILE_SIZE must be greater than 0');
  }

  if (env.port <= 0 || env.port > 65535) {
    errors.push('PORT must be between 1 and 65535');
  }

  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.join('\n')}`);
  }
};

// Log environment configuration (without sensitive data)
export const logEnvironmentInfo = (): void => {
  console.log('Environment Configuration:');
  console.log(`- Node Environment: ${env.nodeEnv}`);
  console.log(`- Port: ${env.port}`);
  console.log(`- Frontend URL: ${env.frontendUrl}`);
  console.log(`- Max File Size: ${(env.maxFileSize / 1024 / 1024).toFixed(1)}MB`);
  console.log(`- Upload Directory: ${env.uploadDir}`);
  console.log(`- Log Level: ${env.logLevel}`);
  console.log(`- Request Logging: ${env.enableRequestLogging ? 'enabled' : 'disabled'}`);
  console.log(`- Performance Monitoring: ${env.enablePerformanceMonitoring ? 'enabled' : 'disabled'}`);
  console.log(`- Gemini API Key: ${env.geminiApiKey ? 'configured' : 'not configured'}`);
};