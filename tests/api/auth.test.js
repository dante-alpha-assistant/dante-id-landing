import { describe, it, expect } from 'vitest'

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3001'

describe('Auth API', () => {
  describe('POST /api/auth/signup', () => {
    it('returns 400 with empty body', async () => {
      const res = await fetch(`${BASE}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      expect([400, 401, 422]).toContain(res.status)
    })
  })

  describe('POST /api/auth/login', () => {
    it('returns 400 with empty body', async () => {
      const res = await fetch(`${BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      expect([400, 401, 422]).toContain(res.status)
    })
  })

  describe('GET /api/auth/github/status', () => {
    it('returns 401 without auth', async () => {
      const res = await fetch(`${BASE}/api/auth/github/status`)
      expect(res.status).toBe(401)
    })
  })

  describe('GET /api/auth/github/connect', () => {
    it('returns 401 without auth', async () => {
      const res = await fetch(`${BASE}/api/auth/github/connect`)
      expect(res.status).toBe(401)
    })
  })

  describe('GET /api/auth/github/callback', () => {
    it('returns 400 or 401 without proper params', async () => {
      const res = await fetch(`${BASE}/api/auth/github/callback`)
      expect([400, 401]).toContain(res.status)
    })
  })
})
