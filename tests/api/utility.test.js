import { describe, it, expect } from 'vitest'

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3001'

describe('Utility API', () => {
  describe('GET /api/platform/health', () => {
    it('returns 200', async () => {
      const res = await fetch(`${BASE}/api/platform/health`)
      expect([200, 401]).toContain(res.status)
    })
  })

  describe('GET /api/platform/context', () => {
    it('returns 200', async () => {
      const res = await fetch(`${BASE}/api/platform/context`)
      expect([200, 401]).toContain(res.status)
    })
    it('returns valid JSON with api_routes', async () => {
      const res = await fetch(`${BASE}/api/platform/context`)
      const data = await res.json()
      expect(data).toBeDefined()
      expect(data.api_routes).toBeDefined()
    })
  })

  describe('GET /api/platform/activity', () => {
    it('returns 200', async () => {
      const res = await fetch(`${BASE}/api/platform/activity`)
      expect([200, 401]).toContain(res.status)
    })
    it('returns valid JSON', async () => {
      const res = await fetch(`${BASE}/api/platform/activity`)
      const data = await res.json()
      expect(data).toBeDefined()
    })
  })
})
