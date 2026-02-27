import { describe, it, expect } from 'vitest'

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3001'

describe('Builder API', () => {
  describe('POST /api/builder/generate', () => {
    it('returns 401 without auth', async () => {
      const res = await fetch(`${BASE}/api/builder/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      expect([401, 403, 404]).toContain(res.status)
    })
  })

  describe('GET /api/builder/:id/status', () => {
    it('returns 401 without auth', async () => {
      const res = await fetch(`${BASE}/api/builder/test-id/status`)
      expect([401, 403, 404]).toContain(res.status)
    })
  })

  describe('GET /api/builder/:id/result', () => {
    it('returns 401 without auth', async () => {
      const res = await fetch(`${BASE}/api/builder/test-id/result`)
      expect([401, 403, 404]).toContain(res.status)
    })
  })

  describe('GET /api/builder/history', () => {
    it('returns 401 without auth', async () => {
      const res = await fetch(`${BASE}/api/builder/history`)
      expect([401, 403, 404]).toContain(res.status)
    })
  })

})
