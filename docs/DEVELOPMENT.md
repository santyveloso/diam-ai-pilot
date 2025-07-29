# Development Guide

## Overview

This guide provides comprehensive information for developers working on the DIAM AI Pilot project. The application is built with a React frontend and Node.js backend, integrated with Google's Gemini 2.5 Flash AI model.

## Architecture

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │    │  Express Server │    │  Gemini 2.5 AI  │
│                 │    │                 │    │                 │
│ - File Upload   │◄──►│ - PDF Processing│◄──►│ - Text Analysis │
│ - Question UI   │    │ - API Endpoints │    │ - Response Gen  │
│ - Response View │    │ - Error Handling│    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack

**Frontend:**
- React 18+ with TypeScript
- Modern CSS for styling
- Axios for HTTP requests
- HTML5 File API for uploads

**Backend:**
- Node.js with Express.js
- TypeScript for type safety
- Multer for file handling
- pdf-parse for PDF text extraction
- Google Generative AI SDK

**Testing:**
- Jest for unit and integration tests
- React Testing Library for component tests
- Puppeteer for end-to-end tests
- Supertest for API testing

## Project Structure

```
diam-ai-pilot/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── App.tsx      # Main application
│   │   │   ├── FileUpload.tsx
│   │   │   ├── QuestionInput.tsx
│   │   │   └── ResponseDisplay.tsx
│   │   ├── services/        # API communication
│   │   │   ├── api.ts       # HTTP client
│   │   │   └── errorService.ts
│   │   ├── types/           # TypeScript definitions
│   │   └── __tests__/       # Component tests
│   └── package.json
├── backend/                  # Node.js server
│   ├── src/
│   │   ├── routes/          # Express routes
│   │   ├── services/        # Business logic
│   │   │   ├── geminiClient.ts
│   │   │   ├── pdfProcessor.ts
│   │   │   └── errorService.ts
│   │   ├── middleware/      # Express middleware
│   │   ├── types/           # TypeScript interfaces
│   │   └── __tests__/       # All test files
│   │       ├── integration/ # Integration tests
│   │       └── e2e/         # End-to-end tests
│   └── package.json
├── docs/                    # Documentation
└── README.md
```

## Development Setup

### Prerequisites

- Node.js 18+ 
- npm 8+
- Google Gemini API key

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd diam-ai-pilot
   npm run install:all
   ```

2. **Environment Configuration:**
   ```bash
   # Backend configuration
   cd backend
   cp .env.example .env
   # Edit .env and add your GEMINI_API_KEY
   ```

3. **Start development servers:**
   ```bash
   # From project root - starts both frontend and backend
   npm run dev:all
   
   # Or start individually:
   npm run dev:frontend  # React dev server (port 3000)
   npm run dev:backend   # Express server (port 3001)
   ```

### Environment Variables

**Backend (.env):**
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3001
NODE_ENV=development
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760  # 10MB in bytes
```

## Development Workflow

### Code Style and Standards

- **TypeScript:** Strict mode enabled
- **ESLint:** Configured for React and Node.js
- **Prettier:** Code formatting (if configured)
- **Naming Conventions:**
  - camelCase for variables and functions
  - PascalCase for React components and types
  - kebab-case for file names and CSS classes

### Git Workflow

1. Create feature branch from main
2. Make changes with descriptive commits
3. Write/update tests for new functionality
4. Run test suite before committing
5. Create pull request with description

### Testing Strategy

#### Unit Tests
```bash
# Run all unit tests
npm test

# Run backend unit tests only
npm run test:backend

# Run frontend unit tests only
npm run test:frontend

# Run with coverage
npm run test:coverage
```

#### Integration Tests
```bash
# Run integration tests
cd backend
npm test -- --testNamePattern="integration"
```

#### End-to-End Tests
```bash
# Run E2E tests (requires both servers running)
cd backend
npm test -- --testNamePattern="e2e"
```

### Debugging

#### Backend Debugging
```bash
# Start with debugger
cd backend
npm run debug

# Or use VS Code debugger with launch.json
```

#### Frontend Debugging
- Use React Developer Tools
- Browser DevTools for network/console
- VS Code debugger for breakpoints

#### API Testing
```bash
# Test API endpoints directly
curl -X POST http://localhost:3001/api/ask \
  -F "file=@test.pdf" \
  -F "question=What is this document about?"
```

## Component Development

### React Component Guidelines

1. **Functional Components:** Use hooks, avoid class components
2. **TypeScript Props:** Define interfaces for all props
3. **Error Boundaries:** Wrap components that might fail
4. **Accessibility:** Include ARIA labels and keyboard navigation
5. **Testing:** Write tests for all user interactions

**Example Component Structure:**
```typescript
import React, { useState, useCallback } from 'react';

interface ComponentProps {
  /** Description of prop */
  propName: string;
  /** Optional prop with default */
  optionalProp?: boolean;
}

/**
 * Component description
 * @param props - Component properties
 * @returns JSX element
 */
const MyComponent: React.FC<ComponentProps> = ({ 
  propName, 
  optionalProp = false 
}) => {
  const [state, setState] = useState<string>('');

  const handleAction = useCallback(() => {
    // Handle user action
  }, []);

  return (
    <div className="my-component">
      {/* Component JSX */}
    </div>
  );
};

export default MyComponent;
```

### Backend Service Guidelines

1. **Error Handling:** Use custom error classes
2. **Validation:** Validate all inputs
3. **Logging:** Log important operations
4. **Type Safety:** Use TypeScript interfaces
5. **Testing:** Mock external dependencies

**Example Service Structure:**
```typescript
import { ServiceError } from '../types';

/**
 * Service for handling specific functionality
 */
export class MyService {
  /**
   * Process data with proper error handling
   * @param input - Input data to process
   * @returns Processed result
   * @throws ServiceError when processing fails
   */
  static async processData(input: string): Promise<ProcessedData> {
    try {
      // Validate input
      if (!input || input.trim().length === 0) {
        throw new ServiceError('INVALID_INPUT', 'Input cannot be empty');
      }

      // Process data
      const result = await this.performProcessing(input);
      
      // Log success
      console.log(`Successfully processed data: ${input.length} chars`);
      
      return result;
    } catch (error) {
      // Log error
      console.error('Data processing failed:', error);
      
      // Re-throw as ServiceError
      if (error instanceof ServiceError) {
        throw error;
      }
      
      throw new ServiceError('PROCESSING_ERROR', 'Failed to process data');
    }
  }

  private static async performProcessing(input: string): Promise<ProcessedData> {
    // Implementation details
  }
}
```

## API Development

### Endpoint Structure

All API endpoints follow RESTful conventions:

- `GET /api/health` - Health check
- `POST /api/ask` - Process question with PDF

### Request/Response Format

**Request:**
```typescript
interface AskRequest {
  file: File;      // PDF file (multipart/form-data)
  question: string; // User question
}
```

**Response:**
```typescript
interface AskResponse {
  success: boolean;
  response?: string;
  error?: {
    code: string;
    message: string;
    requestId: string;
    timestamp: string;
  };
}
```

### Error Handling

All errors follow consistent format:
```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;        // Machine-readable error code
    message: string;     // Human-readable message
    requestId: string;   // Unique request identifier
    timestamp: string;   // ISO timestamp
    details?: any;       // Additional error details (dev only)
  };
}
```

## Performance Considerations

### Frontend Optimization

- **Code Splitting:** Use React.lazy for large components
- **Memoization:** Use React.memo and useMemo appropriately
- **Bundle Size:** Monitor and optimize bundle size
- **Caching:** Implement appropriate caching strategies

### Backend Optimization

- **File Processing:** Stream large files when possible
- **Memory Management:** Clean up temporary files
- **API Limits:** Implement rate limiting
- **Caching:** Cache AI responses for identical questions

## Security Guidelines

### File Upload Security

- Validate file types (PDF only)
- Limit file sizes (10MB max)
- Scan for malicious content
- Clean up temporary files

### API Security

- Input validation and sanitization
- Rate limiting to prevent abuse
- CORS configuration
- Error message sanitization

### Environment Security

- Never commit API keys
- Use environment variables
- Secure file permissions
- Regular dependency updates

## Deployment

### Build Process

```bash
# Build for production
npm run build

# Test production build locally
npm run start:prod
```

### Environment Setup

1. **Production Environment Variables**
2. **SSL/TLS Configuration**
3. **Process Management** (PM2, Docker, etc.)
4. **Monitoring and Logging**
5. **Backup and Recovery**

## Troubleshooting

### Common Issues

1. **API Key Issues:**
   - Verify GEMINI_API_KEY is set
   - Check API key permissions
   - Monitor API usage limits

2. **File Upload Issues:**
   - Check file size limits
   - Verify MIME type validation
   - Ensure upload directory exists

3. **PDF Processing Issues:**
   - Verify pdf-parse installation
   - Check file format compatibility
   - Monitor memory usage

4. **CORS Issues:**
   - Verify CORS configuration
   - Check allowed origins
   - Test with different browsers

### Debug Commands

```bash
# Check environment variables
printenv | grep GEMINI

# Test PDF processing
node -e "const pdf = require('pdf-parse'); console.log('PDF parser loaded');"

# Test API connectivity
curl -X GET http://localhost:3001/api/health

# Check file permissions
ls -la backend/uploads/
```

## Contributing

### Code Review Checklist

- [ ] Code follows style guidelines
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] Error handling is implemented
- [ ] Security considerations addressed
- [ ] Performance impact considered

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes
```

## Resources

- [React Documentation](https://reactjs.org/docs)
- [Express.js Guide](https://expressjs.com/en/guide)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Google Gemini API](https://ai.google.dev/docs)
- [Jest Testing Framework](https://jestjs.io/docs)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro)
##
 Production Environment and Deployment

### Environment Configuration Management

The application uses a centralized environment configuration system located in `backend/src/config/environment.ts`. This provides:

- **Type-safe configuration**: All environment variables are typed and validated
- **Default values**: Sensible defaults for development
- **Validation**: Startup validation ensures required variables are present
- **Logging**: Configuration summary (without sensitive data) on startup

### Production Environment Variables

Required for production deployment:

```bash
# Server Configuration
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com

# Google Gemini API Configuration (Required)
GEMINI_API_KEY=your_actual_api_key_here

# File Upload Configuration
MAX_FILE_SIZE=10485760  # 10MB in bytes
UPLOAD_DIR=uploads/

# Logging Configuration
LOG_LEVEL=info
ENABLE_REQUEST_LOGGING=true

# Performance Monitoring
ENABLE_PERFORMANCE_MONITORING=true
REQUEST_TIMEOUT=30000  # 30 seconds

# Security Configuration
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100  # requests per window
```

### Docker Deployment

The application includes a multi-stage Dockerfile for production deployment:

```bash
# Build Docker image
docker build -t diam-ai-pilot .

# Run container
docker run -p 3001:3001 \
  -e GEMINI_API_KEY=your_key_here \
  -e NODE_ENV=production \
  -e FRONTEND_URL=https://your-domain.com \
  diam-ai-pilot
```

### PM2 Process Management

For Node.js process management in production:

```bash
# Install PM2 globally
npm install -g pm2

# Start application with PM2
pm2 start backend/ecosystem.config.js --env production

# Monitor processes
pm2 monit

# View logs
pm2 logs diam-ai-pilot-backend

# Restart application
pm2 restart diam-ai-pilot-backend
```

## Monitoring and Logging

### Structured Logging System

The application includes a comprehensive logging system (`backend/src/services/logger.ts`):

- **Log levels**: ERROR, WARN, INFO, DEBUG
- **Structured output**: JSON in production, readable in development
- **Request tracking**: Unique request IDs for tracing
- **Performance monitoring**: Request duration and memory usage
- **API call logging**: Detailed logging for external API calls

### Performance Monitoring

Built-in performance monitoring includes:

- **Request ID tracking**: Every request gets a unique identifier
- **Response time monitoring**: Track slow requests (>5 seconds)
- **Memory usage monitoring**: Periodic memory usage reports
- **Error tracking**: Comprehensive error logging with context

### Health Monitoring

The `/health` endpoint provides comprehensive system information:

```json
{
  "status": "OK",
  "message": "DIAM AI Pilot Backend is running",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": "production",
  "version": "1.0.0",
  "uptime": 3600,
  "memory": {
    "rss": 67108864,
    "heapTotal": 29360128,
    "heapUsed": 20971520,
    "external": 1048576
  },
  "geminiConfigured": true
}
```

## Performance Testing

### Automated Performance Tests

The application includes comprehensive performance testing:

```bash
# Run full performance test suite
npm run perf:test

# Run backend performance tests only
npm run perf:backend
```

### Performance Benchmarks

Expected performance targets:
- **Small files (< 1MB)**: < 10 seconds processing time
- **Medium files (1-5MB)**: < 25 seconds processing time
- **Large files (5-10MB)**: < 30 seconds processing time
- **Health check**: < 100ms response time
- **Memory usage**: < 50MB increase per request

### Load Testing Script

The `scripts/performance-test.js` script provides comprehensive load testing:

- **File size testing**: Tests with various PDF sizes
- **Concurrent request handling**: Multiple simultaneous requests
- **Memory leak detection**: Monitors memory usage over time
- **Error handling performance**: Tests error scenarios
- **File size limit enforcement**: Validates upload limits

## Advanced Development Features

### Request Monitoring Middleware

The application includes advanced request monitoring:

- **Request ID generation**: Unique UUID for each request
- **Performance tracking**: Start time and duration monitoring
- **Timeout handling**: Configurable request timeouts
- **Error tracking**: Comprehensive error context logging

### Environment Validation

Startup validation ensures:
- Required environment variables are present
- Numeric values are within valid ranges
- API keys are configured for non-test environments
- File size limits are reasonable

### Development Scripts

Enhanced development scripts for better productivity:

```bash
# Development with enhanced monitoring
npm run dev:all          # Concurrent frontend/backend with prefixes

# Testing with various options
npm run test:watch       # Watch mode for both frontend/backend
npm run perf:test        # Performance testing suite

# Build and deployment
npm run build:prod       # Production-optimized build
npm run clean            # Clean build artifacts
npm run clean:all        # Clean everything including node_modules
```

## Security Enhancements

### File Upload Security

- **MIME type validation**: Strict PDF-only validation
- **File size limits**: Configurable maximum file size
- **Temporary storage**: Automatic cleanup of uploaded files
- **Path traversal protection**: Secure file handling

### API Security

- **Input sanitization**: All user inputs are validated and sanitized
- **Rate limiting**: Configurable request rate limits
- **CORS configuration**: Proper cross-origin request handling
- **Error message sanitization**: No sensitive information in error responses

### Environment Security

- **API key protection**: Never logged or exposed in responses
- **Environment variable validation**: Ensures secure configuration
- **Process isolation**: Non-root user in Docker containers
- **Health check security**: No sensitive information exposed

## Troubleshooting Guide

### Performance Issues

1. **Slow PDF processing**:
   - Check file size and complexity
   - Monitor memory usage during processing
   - Verify Gemini API response times
   - Review request timeout settings

2. **Memory leaks**:
   - Run performance tests to detect leaks
   - Monitor memory usage over time
   - Check for unclosed file handles
   - Verify garbage collection is working

3. **High response times**:
   - Enable performance monitoring
   - Check slow request logs
   - Monitor concurrent request handling
   - Verify network connectivity to Gemini API

### Configuration Issues

1. **Environment variable problems**:
   - Check environment validation logs on startup
   - Verify all required variables are set
   - Ensure numeric values are within valid ranges
   - Test with different environment configurations

2. **API integration issues**:
   - Verify Gemini API key is valid and active
   - Check API usage limits and quotas
   - Monitor API response times and errors
   - Test with different file sizes and content

### Deployment Issues

1. **Docker deployment problems**:
   - Check Dockerfile build process
   - Verify environment variables are passed correctly
   - Monitor container logs for startup errors
   - Test health check endpoint accessibility

2. **PM2 process management**:
   - Check PM2 logs for startup errors
   - Verify ecosystem.config.js configuration
   - Monitor process memory and CPU usage
   - Test automatic restart functionality

This comprehensive development guide provides all the information needed to develop, test, deploy, and maintain the DIAM AI Pilot application effectively.