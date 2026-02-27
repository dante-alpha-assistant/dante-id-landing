import { describe, it, expect } from 'vitest'

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3001'

describe('Github API', () => {
  describe('GET /api/github/repos', () => {
    it('returns 401 without auth', async () => {
      const res = await fetch(`${BASE}/api/github/repos`)
      expect(res.status).toBe(401)
    })
  })

  describe('POST /api/github/connect', () => {
    it('returns 401 without auth', async () => {
      const res = await fetch(`${BASE}/api/github/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      expect(res.status).toBe(401)
    })
  })

  describe('GET /api/github/status', () => {
    it('returns 401 without auth', async () => {
      const res = await fetch(`${BASE}/api/github/status`)
      expect(res.status).toBe(401)
    })
  })

})
