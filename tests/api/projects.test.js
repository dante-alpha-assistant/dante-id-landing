import { describe, it, expect } from 'vitest'

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3001'

describe('Projects API', () => {
  const endpoints = [
    ['GET', '/api/projects'],
    ['POST', '/api/projects'],
    ['GET', '/api/projects/:id', '/api/projects/test-id'],
    ['PUT', '/api/projects/:id', '/api/projects/test-id'],
    ['DELETE', '/api/projects/:id', '/api/projects/test-id'],
    ['GET', '/api/projects/:id/context', '/api/projects/test-id/context'],
    ['GET', '/api/projects/:id/files', '/api/projects/test-id/files'],
    ['POST', '/api/projects/:id/files', '/api/projects/test-id/files'],
    ['GET', '/api/projects/:id/activity', '/api/projects/test-id/activity'],
    ['GET', '/api/projects/:id/settings', '/api/projects/test-id/settings'],
  ]

  endpoints.forEach(([method, label, path]) => {
    const url = path || label
    describe(`${method} ${label}`, () => {
      it('returns 401 without auth', async () => {
        const opts = method === 'GET' ? {} : {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        }
        const res = await fetch(`${BASE}${url}`, opts)
        expect(res.status).toBe(401)
      })
    })
  })
})
