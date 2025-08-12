import { Request, Response, NextFunction } from 'express';
import { ErrorService } from '../services/errorService';

interface RateLimitEntry {
  requests: number;
  windowStart: number;
  sessionId: string;
}

interface SessionRateLimit {
  [sessionId: string]: RateLimitEntry;
}

// In-memory store for rate limiting (per session)
const rateLimitStore: SessionRateLimit = {};

// Rate limit configuration
const RATE_LIMIT_CONFIG = {
  maxRequests: 2,           // Maximum 2 requests
  windowMs: 60 * 1000,      // Per 1 minute (60 seconds)
  cleanupIntervalMs: 5 * 60 * 1000  // Cleanup old entries every 5 minutes
};

/**
 * Generates or retrieves session ID from request
 * Uses IP + User-Agent as session identifier for simplicity
 */
function getSessionId(req: Request): string {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  const userAgent = req.get('User-Agent') || 'unknown';
  
  // Create a simple hash-like session ID
  const sessionData = `${ip}-${userAgent}`;
  return Buffer.from(sessionData).toString('base64').substring(0, 32);
}

/**
 * Cleanup expired rate limit entries
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  const expiredThreshold = now - (RATE_LIMIT_CONFIG.windowMs * 2); // Keep entries for 2 windows
  
  Object.keys(rateLimitStore).forEach(sessionId => {
    const entry = rateLimitStore[sessionId];
    if (entry.windowStart < expiredThreshold) {
      delete rateLimitStore[sessionId];
    }
  });
}

/**
 * Rate limiting middleware for Gemini API calls
 * Limits to 2 requests per minute per session
 */
export const rateLimitMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const sessionId = getSessionId(req);
  const now = Date.now();
  
  // Get or create rate limit entry for this session
  let entry = rateLimitStore[sessionId];
  
  if (!entry) {
    // First request from this session
    entry = {
      requests: 0,
      windowStart: now,
      sessionId
    };
    rateLimitStore[sessionId] = entry;
  }
  
  // Check if we need to reset the window
  const windowElapsed = now - entry.windowStart;
  if (windowElapsed >= RATE_LIMIT_CONFIG.windowMs) {
    // Reset the window
    entry.requests = 0;
    entry.windowStart = now;
  }
  
  // Check if rate limit is exceeded
  if (entry.requests >= RATE_LIMIT_CONFIG.maxRequests) {
    const timeUntilReset = RATE_LIMIT_CONFIG.windowMs - windowElapsed;
    const resetTime = new Date(now + timeUntilReset);
    
    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': RATE_LIMIT_CONFIG.maxRequests.toString(),
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': resetTime.toISOString(),
      'Retry-After': Math.ceil(timeUntilReset / 1000).toString()
    });
    
    // Create rate limit error
    const error = ErrorService.createError(
      'RATE_LIMIT_EXCEEDED',
      `Rate limit exceeded. Maximum ${RATE_LIMIT_CONFIG.maxRequests} requests per minute allowed. Try again in ${Math.ceil(timeUntilReset / 1000)} seconds.`
    );
    
    // Log rate limit violation
    console.warn(`Rate limit exceeded for session ${sessionId}`, {
      sessionId,
      requests: entry.requests,
      windowStart: new Date(entry.windowStart).toISOString(),
      timeUntilReset: `${Math.ceil(timeUntilReset / 1000)}s`,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    return next(error);
  }
  
  // Increment request count
  entry.requests++;
  
  // Set rate limit headers
  const remaining = Math.max(0, RATE_LIMIT_CONFIG.maxRequests - entry.requests);
  const resetTime = new Date(entry.windowStart + RATE_LIMIT_CONFIG.windowMs);
  
  res.set({
    'X-RateLimit-Limit': RATE_LIMIT_CONFIG.maxRequests.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': resetTime.toISOString()
  });
  
  // Log successful rate limit check
  console.log(`Rate limit check passed for session ${sessionId}`, {
    sessionId,
    requests: entry.requests,
    remaining,
    resetTime: resetTime.toISOString()
  });
  
  next();
};

/**
 * Get current rate limit status for a session
 */
export function getRateLimitStatus(req: Request): {
  sessionId: string;
  requests: number;
  remaining: number;
  resetTime: Date;
  windowStart: Date;
} {
  const sessionId = getSessionId(req);
  const now = Date.now();
  const entry = rateLimitStore[sessionId];
  
  if (!entry) {
    return {
      sessionId,
      requests: 0,
      remaining: RATE_LIMIT_CONFIG.maxRequests,
      resetTime: new Date(now + RATE_LIMIT_CONFIG.windowMs),
      windowStart: new Date(now)
    };
  }
  
  // Check if window has expired
  const windowElapsed = now - entry.windowStart;
  if (windowElapsed >= RATE_LIMIT_CONFIG.windowMs) {
    return {
      sessionId,
      requests: 0,
      remaining: RATE_LIMIT_CONFIG.maxRequests,
      resetTime: new Date(now + RATE_LIMIT_CONFIG.windowMs),
      windowStart: new Date(now)
    };
  }
  
  return {
    sessionId,
    requests: entry.requests,
    remaining: Math.max(0, RATE_LIMIT_CONFIG.maxRequests - entry.requests),
    resetTime: new Date(entry.windowStart + RATE_LIMIT_CONFIG.windowMs),
    windowStart: new Date(entry.windowStart)
  };
}

/**
 * Clear rate limit for a specific session (for testing/admin purposes)
 */
export function clearRateLimit(sessionId: string): boolean {
  if (rateLimitStore[sessionId]) {
    delete rateLimitStore[sessionId];
    return true;
  }
  return false;
}

/**
 * Get all active rate limit sessions (for monitoring)
 */
export function getActiveSessions(): Array<{
  sessionId: string;
  requests: number;
  windowStart: Date;
  remaining: number;
}> {
  const now = Date.now();
  
  return Object.values(rateLimitStore)
    .filter(entry => (now - entry.windowStart) < RATE_LIMIT_CONFIG.windowMs)
    .map(entry => ({
      sessionId: entry.sessionId,
      requests: entry.requests,
      windowStart: new Date(entry.windowStart),
      remaining: Math.max(0, RATE_LIMIT_CONFIG.maxRequests - entry.requests)
    }));
}

// Start cleanup interval with better memory management
if (process.env.NODE_ENV !== 'test') {
  const cleanupInterval = setInterval(() => {
    try {
      cleanupExpiredEntries();
      
      // Additional safety: limit total entries to prevent memory issues
      const totalEntries = Object.keys(rateLimitStore).length;
      if (totalEntries > 10000) {
        console.warn(`Rate limit store has ${totalEntries} entries, forcing cleanup`);
        // Keep only the most recent 5000 entries
        const entries = Object.entries(rateLimitStore)
          .sort(([,a], [,b]) => b.windowStart - a.windowStart)
          .slice(0, 5000);
        
        // Clear store and repopulate with recent entries
        Object.keys(rateLimitStore).forEach(key => delete rateLimitStore[key]);
        entries.forEach(([key, value]) => rateLimitStore[key] = value);
      }
    } catch (error) {
      console.error('Rate limiter cleanup error:', error);
    }
  }, RATE_LIMIT_CONFIG.cleanupIntervalMs);
  
  // Ensure cleanup interval is cleared on process exit
  process.on('SIGTERM', () => clearInterval(cleanupInterval));
  process.on('SIGINT', () => clearInterval(cleanupInterval));
  
  console.log(`Rate limiter initialized: ${RATE_LIMIT_CONFIG.maxRequests} requests per ${RATE_LIMIT_CONFIG.windowMs / 1000}s per session`);
}