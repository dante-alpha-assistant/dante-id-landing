import { describe, it, expect } from 'vitest'

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3001'

describe('Refinery API', () => {
  describe('POST /api/refinery/extract', () => {
    it('returns 401 without auth', async () => {
      const res = await fetch(`${BASE}/api/refinery/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      expect(res.status).toBe(401)
    })
  })

  describe('POST /api/refinery/analyze', () => {
    it('returns 401 without auth', async () => {
      const res = await fetch(`${BASE}/api/refinery/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      expect(res.status).toBe(401)
    })
  })

  describe('POST /api/refinery/validate', () => {
    it('returns 401 without auth', async () => {
      const res = await fetch(`${BASE}/api/refinery/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      expect(res.status).toBe(401)
    })
  })

  describe('GET /api/refinery/:id/status', () => {
    it('returns 401 without auth', async () => {
      const res = await fetch(`${BASE}/api/refinery/test-id/status`)
      expect(res.status).toBe(401)
    })
  })

  describe('GET /api/refinery/:id/result', () => {
    it('returns 401 without auth', async () => {
      const res = await fetch(`${BASE}/api/refinery/test-id/result`)
      expect(res.status).toBe(401)
    })
  })

  describe('POST /api/refinery/batch', () => {
    it('returns 401 without auth', async () => {
      const res = await fetch(`${BASE}/api/refinery/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      expect(res.status).toBe(401)
    })
  })

  describe('GET /api/refinery/history', () => {
    it('returns 401 without auth', async () => {
      const res = await fetch(`${BASE}/api/refinery/history`)
      expect(res.status).toBe(401)
    })
  })

})
