# Rate Limiting Documentation

## Overview

The DIAM AI Pilot backend implements strict rate limiting to control usage of the Google Gemini AI API. This ensures responsible usage and prevents abuse while the system is in development.

## Rate Limit Configuration

- **Limit**: 2 requests per minute per session
- **Window**: 60 seconds (1 minute)
- **Scope**: Per session (based on IP address + User-Agent)
- **Endpoints**: Applied only to `/api/ask` endpoint

## How It Works

### Session Identification
Each user session is identified by a combination of:
- IP address
- User-Agent string

This creates a unique session ID that persists across requests from the same client.

### Rate Limit Tracking
- Each session can make up to 2 requests per minute
- The rate limit window resets every 60 seconds
- Requests are tracked in memory (no persistent storage)
- Old entries are automatically cleaned up every 5 minutes

### Rate Limit Headers
All responses include rate limit information in headers:
- `X-RateLimit-Limit`: Maximum requests allowed (2)
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: ISO timestamp when the window resets
- `Retry-After`: Seconds to wait before retrying (only when rate limited)

## API Endpoints

### POST /api/ask
The main endpoint for asking questions about uploaded PDFs.
- **Rate Limited**: Yes (2 requests/minute per session)
- **Response**: 429 Too Many Requests when limit exceeded

### GET /api/rate-limit-status
Check current rate limit status for your session.
- **Rate Limited**: No
- **Response**: Current rate limit information

```json
{
  "success": true,
  "rateLimit": {
    "limit": 2,
    "remaining": 1,
    "resetTime": "2025-08-11T12:22:52.656Z",
    "windowStart": "2025-08-11T12:21:52.656Z",
    "requests": 1,
    "sessionId": "OjpmZmZm..."
  }
}
```

## Error Responses

When rate limit is exceeded, the API returns:

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Service temporarily unavailable due to high demand. Please try again later.",
    "timestamp": "2025-08-11T12:21:52.681Z",
    "requestId": "4e47dc98-094e-45e4-8bb7-ff0dd21b09c5"
  }
}
```

## Implementation Details

### In-Memory Storage
- Rate limit data is stored in memory for performance
- Data is automatically cleaned up to prevent memory leaks
- No persistent storage means limits reset on server restart

### Session-Based Tracking
- Each unique IP + User-Agent combination gets its own rate limit
- Different browsers/devices from the same IP are tracked separately
- Incognito/private browsing creates new sessions

### Cleanup Process
- Expired rate limit entries are cleaned up every 5 minutes
- Entries older than 2 rate limit windows are removed
- Memory usage is kept minimal

## Development and Testing

### Testing Rate Limits
Use the rate limit status endpoint to check your current status:
```bash
curl http://localhost:3001/api/rate-limit-status
```

### Bypassing for Development
Rate limits can be cleared programmatically for testing:
```typescript
import { clearRateLimit } from '../middleware/rateLimiter';
clearRateLimit(sessionId);
```

### Monitoring
Active sessions can be monitored:
```typescript
import { getActiveSessions } from '../middleware/rateLimiter';
const sessions = getActiveSessions();
```

## Security Considerations

### Protection Against Abuse
- Prevents API quota exhaustion
- Limits costs from excessive usage
- Protects against simple DoS attacks

### Limitations
- IP-based tracking can affect users behind NAT/proxies
- Memory-based storage doesn't persist across restarts
- Simple session identification could be bypassed

### Future Improvements
- Consider Redis for distributed rate limiting
- Implement user-based authentication for better tracking
- Add configurable rate limits per user type
- Implement exponential backoff for repeated violations

## Configuration

Rate limit settings are defined in `backend/src/middleware/rateLimiter.ts`:

```typescript
const RATE_LIMIT_CONFIG = {
  maxRequests: 2,           // Maximum 2 requests
  windowMs: 60 * 1000,      // Per 1 minute (60 seconds)
  cleanupIntervalMs: 5 * 60 * 1000  // Cleanup every 5 minutes
};
```

To modify these settings, update the configuration and restart the server.