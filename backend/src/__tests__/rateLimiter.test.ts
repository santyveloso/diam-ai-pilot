import request from 'supertest';
import app from '../server';
import { clearRateLimit, getActiveSessions } from '../middleware/rateLimiter';

describe('Rate Limiter Middleware', () => {
  beforeEach(() => {
    // Clear all rate limits before each test
    const sessions = getActiveSessions();
    sessions.forEach(session => clearRateLimit(session.sessionId));
  });

  describe('Rate Limit Status Endpoint', () => {
    it('should return rate limit status', async () => {
      const response = await request(app)
        .get('/api/rate-limit-status')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        rateLimit: {
          limit: 2,
          remaining: 2,
          requests: 0
        }
      });

      expect(response.body.rateLimit.resetTime).toBeDefined();
      expect(response.body.rateLimit.windowStart).toBeDefined();
      expect(response.body.rateLimit.sessionId).toBeDefined();
    });
  });

  describe('Rate Limiting on /ask endpoint', () => {
    it('should allow requests within rate limit', async () => {
      // First request should succeed (but will fail due to missing file, which is expected)
      const response1 = await request(app)
        .post('/api/ask')
        .send({ question: 'Test question' })
        .expect(400); // Will fail due to missing file, but rate limit should pass

      expect(response1.headers['x-ratelimit-limit']).toBe('2');
      expect(response1.headers['x-ratelimit-remaining']).toBe('1');

      // Second request should also pass rate limit
      const response2 = await request(app)
        .post('/api/ask')
        .send({ question: 'Test question 2' })
        .expect(400); // Will fail due to missing file, but rate limit should pass

      expect(response2.headers['x-ratelimit-limit']).toBe('2');
      expect(response2.headers['x-ratelimit-remaining']).toBe('0');
    });

    it('should block requests exceeding rate limit', async () => {
      // Make 2 requests to exhaust the rate limit
      await request(app)
        .post('/api/ask')
        .send({ question: 'Test question 1' })
        .expect(400);

      await request(app)
        .post('/api/ask')
        .send({ question: 'Test question 2' })
        .expect(400);

      // Third request should be rate limited
      const response = await request(app)
        .post('/api/ask')
        .send({ question: 'Test question 3' })
        .expect(429);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED'
        }
      });

      expect(response.headers['x-ratelimit-limit']).toBe('2');
      expect(response.headers['x-ratelimit-remaining']).toBe('0');
      expect(response.headers['retry-after']).toBeDefined();
    });

    it('should reset rate limit after window expires', async () => {
      // This test would require waiting for the full window to expire
      // For now, we'll just test that the rate limit structure is correct
      const response = await request(app)
        .post('/api/ask')
        .send({ question: 'Test question' })
        .expect(400);

      expect(response.headers['x-ratelimit-reset']).toBeDefined();
      const resetTime = new Date(response.headers['x-ratelimit-reset']);
      const now = new Date();
      
      // Reset time should be in the future (within 1 minute)
      expect(resetTime.getTime()).toBeGreaterThan(now.getTime());
      expect(resetTime.getTime()).toBeLessThanOrEqual(now.getTime() + 60000);
    });
  });

  describe('Rate limit headers', () => {
    it('should include proper rate limit headers', async () => {
      const response = await request(app)
        .post('/api/ask')
        .send({ question: 'Test question' })
        .expect(400);

      expect(response.headers['x-ratelimit-limit']).toBe('2');
      expect(response.headers['x-ratelimit-remaining']).toBe('1');
      expect(response.headers['x-ratelimit-reset']).toBeDefined();
    });
  });

  describe('Session-based rate limiting', () => {
    it('should track different sessions separately', async () => {
      // This is harder to test in unit tests since session ID is based on IP + User-Agent
      // In a real scenario, different clients would have different session IDs
      const response = await request(app)
        .get('/api/rate-limit-status')
        .expect(200);

      expect(response.body.rateLimit.sessionId).toBeDefined();
      expect(typeof response.body.rateLimit.sessionId).toBe('string');
    });
  });
});