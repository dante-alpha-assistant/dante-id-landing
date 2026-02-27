import { describe, it, expect } from 'vitest'

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3001'

describe('Foundry API', () => {
  describe('POST /api/foundry/generate', () => {
    it('returns 401 without auth', async () => {
      const res = await fetch(`${BASE}/api/foundry/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      expect(res.status).toBe(401)
    })
  })

  describe('POST /api/foundry/iterate', () => {
    it('returns 401 without auth', async () => {
      const res = await fetch(`${BASE}/api/foundry/iterate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      expect(res.status).toBe(401)
    })
  })

  describe('GET /api/foundry/:id/status', () => {
    it('returns 401 without auth', async () => {
      const res = await fetch(`${BASE}/api/foundry/test-id/status`)
      expect(res.status).toBe(401)
    })
  })

  describe('GET /api/foundry/:id/result', () => {
    it('returns 401 without auth', async () => {
      const res = await fetch(`${BASE}/api/foundry/test-id/result`)
      expect(res.status).toBe(401)
    })
  })

  describe('GET /api/foundry/:id/preview', () => {
    it('returns 401 without auth', async () => {
      const res = await fetch(`${BASE}/api/foundry/test-id/preview`)
      expect(res.status).toBe(401)
    })
  })

  describe('POST /api/foundry/batch', () => {
    it('returns 401 without auth', async () => {
      const res = await fetch(`${BASE}/api/foundry/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      expect(res.status).toBe(401)
    })
  })

  describe('GET /api/foundry/history', () => {
    it('returns 401 without auth', async () => {
      const res = await fetch(`${BASE}/api/foundry/history`)
      expect(res.status).toBe(401)
    })
  })

})
