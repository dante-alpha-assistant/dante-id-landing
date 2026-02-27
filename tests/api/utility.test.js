import { describe, it, expect } from 'vitest'

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3001'

describe('Utility API', () => {
  describe('GET /api/platform/health', () => {
    it('returns 200', async () => {
      const res = await fetch(`${BASE}/api/platform/health`)
      expect(res.status).toBe(200)
    })
  })

  describe('GET /api/platform/context', () => {
    it('returns 200', async () => {
      const res = await fetch(`${BASE}/api/platform/context`)
      expect(res.status).toBe(200)
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
      expect(res.status).toBe(200)
    })
    it('returns valid JSON', async () => {
      const res = await fetch(`${BASE}/api/platform/activity`)
      const data = await res.json()
      expect(data).toBeDefined()
    })
  })
})
