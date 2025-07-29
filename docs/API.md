# API Documentation

## Overview

The DIAM AI Pilot API provides endpoints for processing PDF documents and generating AI-powered responses to user questions. The API is built with Express.js and integrates with Google's Gemini 2.5 Flash model.

**Base URL:** `http://localhost:3001/api`

## Authentication

Currently, no authentication is required. This is a prototype application designed for educational use.

## Endpoints

### Health Check

Check the API server status and service health.

**Endpoint:** `GET /api/health`

**Response:**
```json
{
  "status": "OK",
  "message": "DIAM AI Pilot Backend is running",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "environment": "development",
  "services": {
    "gemini": "healthy"
  },
  "uptime": 3600
}
```

**Status Codes:**
- `200` - Service is healthy
- `503` - Service unavailable

---

### Process Question

Upload a PDF document and ask a question about its content.

**Endpoint:** `POST /api/ask`

**Content-Type:** `multipart/form-data`

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file` | File | Yes | PDF file to analyze (max 10MB) |
| `question` | String | Yes | Question about the document (10-1000 chars) |

**Request Example:**
```bash
curl -X POST http://localhost:3001/api/ask \
  -F "file=@document.pdf" \
  -F "question=What is the main topic of this document?"
```

**Success Response:**
```json
{
  "success": true,
  "response": "Based on the document provided, the main topic is..."
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "MISSING_FILE",
    "message": "PDF file is required. Please upload a file.",
    "requestId": "uuid-string",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

**Status Codes:**
- `200` - Success
- `400` - Bad Request (validation error)
- `413` - Payload Too Large
- `429` - Too Many Requests
- `500` - Internal Server Error

## Error Codes

### Client Errors (4xx)

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `MISSING_FILE` | 400 | No PDF file provided |
| `MISSING_QUESTION` | 400 | No question provided |
| `INVALID_FILE_TYPE` | 400 | File is not a PDF |
| `FILE_TOO_LARGE` | 413 | File exceeds 10MB limit |
| `QUESTION_TOO_SHORT` | 400 | Question under 10 characters |
| `QUESTION_TOO_LONG` | 400 | Question over 1000 characters |
| `PDF_PROCESSING_ERROR` | 400 | Failed to extract text from PDF |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |

### Server Errors (5xx)

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error |
| `AI_GENERATION_ERROR` | 500 | AI model processing failed |
| `SERVICE_UNAVAILABLE` | 503 | External service unavailable |

## Request/Response Examples

### Successful Question Processing

**Request:**
```http
POST /api/ask HTTP/1.1
Host: localhost:3001
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

------WebKitFormBoundary
Content-Disposition: form-data; name="file"; filename="course-material.pdf"
Content-Type: application/pdf

[PDF binary data]
------WebKitFormBoundary
Content-Disposition: form-data; name="question"

What are the key concepts explained in this document?
------WebKitFormBoundary--
```

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json
Access-Control-Allow-Origin: *

{
  "success": true,
  "response": "Based on the document provided, the key concepts explained include:\n\n1. **Object-Oriented Programming**: The document covers the fundamental principles of OOP including encapsulation, inheritance, and polymorphism.\n\n2. **Design Patterns**: Several common design patterns are discussed, such as Singleton, Factory, and Observer patterns.\n\n3. **Best Practices**: The document emphasizes coding best practices including proper naming conventions, code organization, and documentation.\n\nThese concepts are presented with practical examples and exercises to help students understand their application in real-world scenarios."
}
```

### File Validation Error

**Request:**
```http
POST /api/ask HTTP/1.1
Host: localhost:3001
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

------WebKitFormBoundary
Content-Disposition: form-data; name="file"; filename="document.txt"
Content-Type: text/plain

This is not a PDF file
------WebKitFormBoundary
Content-Disposition: form-data; name="question"

What is this about?
------WebKitFormBoundary--
```

**Response:**
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "success": false,
  "error": {
    "code": "INVALID_FILE_TYPE",
    "message": "Only PDF files are supported. Please upload a PDF file.",
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

### Question Validation Error

**Request:**
```http
POST /api/ask HTTP/1.1
Host: localhost:3001
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

------WebKitFormBoundary
Content-Disposition: form-data; name="file"; filename="document.pdf"
Content-Type: application/pdf

[PDF binary data]
------WebKitFormBoundary
Content-Disposition: form-data; name="question"

Hi
------WebKitFormBoundary--
```

**Response:**
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "success": false,
  "error": {
    "code": "QUESTION_TOO_SHORT",
    "message": "Question must be at least 10 characters long.",
    "requestId": "550e8400-e29b-41d4-a716-446655440001",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Limit:** 10 requests per minute per IP
- **Headers:** Rate limit information is included in response headers
- **Exceeded:** Returns `429 Too Many Requests` when limit exceeded

**Rate Limit Headers:**
```http
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1640995200
```

## File Upload Specifications

### Supported Formats
- **MIME Type:** `application/pdf`
- **File Extension:** `.pdf`
- **Maximum Size:** 10MB (10,485,760 bytes)

### File Validation
1. **MIME Type Check:** Validates `Content-Type` header
2. **Extension Check:** Validates file extension
3. **Size Check:** Validates file size
4. **Content Check:** Validates PDF structure
5. **Text Extraction:** Ensures extractable text content

### Processing Pipeline
1. **Upload:** File received via multipart/form-data
2. **Validation:** File type, size, and format validation
3. **Storage:** Temporary storage in upload directory
4. **Extraction:** Text extraction using pdf-parse
5. **Processing:** AI analysis with Gemini 2.5 Flash
6. **Cleanup:** Temporary file removal
7. **Response:** Formatted response to client

## Language Support

The API supports bilingual operation:

### Automatic Language Detection
- **Portuguese:** Detected by keywords like "o que", "como", "por que"
- **English:** Default language for other inputs
- **Response Language:** Matches detected question language

### Supported Languages
- **English (en):** Default language
- **Portuguese (pt):** Full support for Brazilian Portuguese

## Security Considerations

### Input Validation
- All inputs are validated and sanitized
- File type restrictions enforced
- Size limits strictly enforced
- Question length validation

### File Security
- Temporary file storage only
- Automatic cleanup after processing
- No persistent file storage
- Secure file handling practices

### Error Handling
- Sensitive information not exposed in errors
- Generic error messages in production
- Detailed logging for debugging
- Request tracking with unique IDs

## Performance Characteristics

### Response Times
- **Health Check:** < 100ms
- **File Upload:** < 1s (depends on file size)
- **PDF Processing:** 1-3s (depends on document complexity)
- **AI Generation:** 5-15s (depends on question complexity)
- **Total Request:** 10-20s typical

### Throughput
- **Concurrent Requests:** Limited by AI API rate limits
- **File Processing:** Single-threaded PDF processing
- **Memory Usage:** Temporary spike during file processing

### Optimization
- Streaming file uploads
- Efficient PDF text extraction
- Connection pooling for AI API
- Automatic resource cleanup

## Development and Testing

### Local Development
```bash
# Start development server
npm run dev

# Test API endpoint
curl -X GET http://localhost:3001/api/health
```

### Testing Endpoints
```bash
# Health check
curl -X GET http://localhost:3001/api/health

# Question processing
curl -X POST http://localhost:3001/api/ask \
  -F "file=@test.pdf" \
  -F "question=What is this document about?"

# Error testing
curl -X POST http://localhost:3001/api/ask \
  -F "question=Test without file"
```

### Integration Testing
The API includes comprehensive integration tests covering:
- Complete request/response cycles
- Error handling scenarios
- File validation
- Rate limiting
- CORS functionality

## Monitoring and Logging

### Request Logging
All requests are logged with:
- Timestamp
- Request method and path
- Response status
- Processing time
- Error details (if any)

### Error Logging
Errors include:
- Request ID for tracking
- Timestamp
- Error code and message
- Stack trace (development only)
- Request context

### Health Monitoring
- Service availability
- AI API connectivity
- Response time metrics
- Error rate tracking

## Future Enhancements

### Planned Features
- Authentication and authorization
- User session management
- Response caching
- Multiple file format support
- Batch processing capabilities

### API Versioning
- Current version: v1 (implicit)
- Future versions will use URL versioning: `/api/v2/`
- Backward compatibility maintained

## Support and Contact

For API support and questions:
- **Documentation:** This document
- **Issues:** GitHub repository issues
- **Development:** See DEVELOPMENT.md guide