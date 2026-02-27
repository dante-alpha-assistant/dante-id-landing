import { describe, it, expect } from 'vitest'

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3001'

describe('Planner API', () => {
  describe('POST /api/planner/generate', () => {
    it('returns 401 without auth', async () => {
      const res = await fetch(`${BASE}/api/planner/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      expect(res.status).toBe(401)
    })
  })

  describe('GET /api/planner/:id/status', () => {
    it('returns 401 without auth', async () => {
      const res = await fetch(`${BASE}/api/planner/test-id/status`)
      expect(res.status).toBe(401)
    })
  })

  describe('GET /api/planner/:id/result', () => {
    it('returns 401 without auth', async () => {
      const res = await fetch(`${BASE}/api/planner/test-id/result`)
      expect(res.status).toBe(401)
    })
  })

  describe('GET /api/planner/history', () => {
    it('returns 401 without auth', async () => {
      const res = await fetch(`${BASE}/api/planner/history`)
      expect(res.status).toBe(401)
    })
  })

})
