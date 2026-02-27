import { describe, it, expect } from 'vitest'

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3001'

describe('Inspector API', () => {
  describe('POST /api/inspector/run', () => {
    it('returns 401 without auth', async () => {
      const res = await fetch(`${BASE}/api/inspector/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      expect(res.status).toBe(401)
    })
  })

  describe('GET /api/inspector/:id/status', () => {
    it('returns 401 without auth', async () => {
      const res = await fetch(`${BASE}/api/inspector/test-id/status`)
      expect(res.status).toBe(401)
    })
  })

  describe('GET /api/inspector/:id/result', () => {
    it('returns 401 without auth', async () => {
      const res = await fetch(`${BASE}/api/inspector/test-id/result`)
      expect(res.status).toBe(401)
    })
  })

  describe('GET /api/inspector/history', () => {
    it('returns 401 without auth', async () => {
      const res = await fetch(`${BASE}/api/inspector/history`)
      expect(res.status).toBe(401)
    })
  })

})
