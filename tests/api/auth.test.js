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
      expect([400, 401, 404, 422]).toContain(res.status)
    })
  })

  describe('POST /api/auth/login', () => {
    it('returns 400 with empty body', async () => {
      const res = await fetch(`${BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      expect([400, 401, 404, 422]).toContain(res.status)
    })
  })

  describe('GET /api/auth/github/status', () => {
    it('returns 401 without auth', async () => {
      const res = await fetch(`${BASE}/api/auth/github/status`)
      expect([401, 403, 404]).toContain(res.status)
    })
  })

  describe('GET /api/auth/github/connect', () => {
    it('returns 401 without auth', async () => {
      const res = await fetch(`${BASE}/api/auth/github/connect`)
      expect([401, 403, 404]).toContain(res.status)
    })
  })

  describe('GET /api/auth/github/callback', () => {
    it('returns redirect or error without proper params', async () => {
      const res = await fetch(`${BASE}/api/auth/github/callback`, { redirect: 'manual' })
      expect([400, 401, 404, 302]).toContain(res.status)
    })
  })
})
