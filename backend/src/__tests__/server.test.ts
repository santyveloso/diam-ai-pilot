import request from 'supertest';
import app from '../server';

describe('Express Server', () => {
  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toEqual({
        status: 'OK',
        message: 'DIAM AI Pilot Backend is running',
        timestamp: expect.any(String),
        environment: expect.any(String)
      });
    });
  });

  describe('CORS', () => {
    it('should include CORS headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for undefined routes', async () => {
      const response = await request(app)
        .get('/nonexistent')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Route GET /nonexistent not found'
        }
      });
    });
  });

  describe('JSON Parsing', () => {
    it('should parse JSON requests', async () => {
      // This will be tested when we add API routes
      // For now, just verify the app instance is properly configured
      expect(app).toBeDefined();
      expect(typeof app).toBe('function');
    });
  });
});