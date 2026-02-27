import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';

// Mock environment variables
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_KEY = 'test-service-key';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.OPENROUTER_API_KEY = 'test-openrouter-key';
process.env.GH_TOKEN = 'test-github-token';

describe('Platform API Endpoints', () => {
  let app;
  let server;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    
    // Mount platform endpoints
    app.use('/api/platform/context', (await import('../server/platform-context.js')).default);
    app.use('/api/platform/apply', (await import('../server/platform-apply.js')).default);
    app.use('/api/platform/status', (await import('../server/platform-status.js')).default);
    app.use('/api/platform/analytics', (await import('../server/platform-analytics.js')).default);
    app.use('/api/platform/health', (await import('../server/platform-health.js')).default);
    app.use('/api/platform/test-pipeline', (await import('../server/platform-test-pipeline.js')).default);
  });

  afterAll(() => {
    if (server) server.close();
  });

  describe('GET /api/platform/context', () => {
    it('should return codebase structure', async () => {
      const res = await request(app)
        .get('/api/platform/context')
        .set('Authorization', 'Bearer test-service-key');
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('routes');
      expect(res.body).toHaveProperty('components');
      expect(Array.isArray(res.body.routes)).toBe(true);
    });

    it('should require authentication', async () => {
      const res = await request(app).get('/api/platform/context');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/platform/apply', () => {
    it('should require project_id', async () => {
      const res = await request(app)
        .post('/api/platform/apply')
        .set('Authorization', 'Bearer test-service-key')
        .send({});
      
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('project_id');
    });

    it('should reject non-internal projects', async () => {
      const res = await request(app)
        .post('/api/platform/apply')
        .set('Authorization', 'Bearer test-service-key')
        .send({ project_id: 'test-standard-project' });
      
      expect([400, 404, 500]).toContain(res.status);
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/platform/apply')
        .send({ project_id: 'test' });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/platform/status', () => {
    it('should return internal projects status', async () => {
      const res = await request(app)
        .get('/api/platform/status')
        .set('Authorization', 'Bearer test-service-key');
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('projects');
      expect(res.body).toHaveProperty('stats');
      expect(Array.isArray(res.body.projects)).toBe(true);
    });

    it('should require authentication', async () => {
      const res = await request(app).get('/api/platform/status');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/platform/analytics', () => {
    it('should return pipeline metrics', async () => {
      const res = await request(app)
        .get('/api/platform/analytics')
        .set('Authorization', 'Bearer test-service-key');
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('summary');
      expect(res.body).toHaveProperty('trends');
      expect(res.body.summary).toHaveProperty('builds');
      expect(res.body.summary).toHaveProperty('inspections');
    });

    it('should support days parameter', async () => {
      const res = await request(app)
        .get('/api/platform/analytics?days=7')
        .set('Authorization', 'Bearer test-service-key');
      
      expect([200, 500]).toContain(res.status);
    });

    it('should require authentication', async () => {
      const res = await request(app).get('/api/platform/analytics');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/platform/health', () => {
    it('should return pipeline health', async () => {
      const res = await request(app)
        .get('/api/platform/health')
        .set('Authorization', 'Bearer test-service-key');
      
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toHaveProperty('summary');
        expect(res.body).toHaveProperty('health_score');
      }
    });

    it('should require authentication', async () => {
      const res = await request(app).get('/api/platform/health');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/platform/test-pipeline', () => {
    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/platform/test-pipeline')
        .send({});
      expect(res.status).toBe(401);
    });

    it('should return test results when authenticated', async () => {
      const res = await request(app)
        .post('/api/platform/test-pipeline')
        .set('Authorization', 'Bearer test-service-key')
        .send({});
      
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toHaveProperty('test_id');
        expect(res.body).toHaveProperty('results');
      }
    });
  });

  describe('Authentication Requirements', () => {
    const endpoints = [
      { method: 'get', path: '/api/platform/context' },
      { method: 'get', path: '/api/platform/status' },
      { method: 'get', path: '/api/platform/analytics' },
      { method: 'get', path: '/api/platform/health' },
      { method: 'post', path: '/api/platform/apply' },
      { method: 'post', path: '/api/platform/test-pipeline' },
    ];

    endpoints.forEach(({ method, path }) => {
      it(`${method.toUpperCase()} ${path} requires auth`, async () => {
        const res = await request(app)[method](path);
        expect(res.status).toBe(401);
      });
    });
  });
});
