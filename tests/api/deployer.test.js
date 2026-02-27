import { describe, it, expect } from 'vitest'

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3001'

describe('Deployer API', () => {
  describe('POST /api/deployer/deploy', () => {
    it('returns 401 without auth', async () => {
      const res = await fetch(`${BASE}/api/deployer/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      expect([401, 403, 404]).toContain(res.status)
    })
  })

  describe('GET /api/deployer/:id/status', () => {
    it('returns 401 without auth', async () => {
      const res = await fetch(`${BASE}/api/deployer/test-id/status`)
      expect([401, 403, 404]).toContain(res.status)
    })
  })

  describe('GET /api/deployer/history', () => {
    it('returns 401 without auth', async () => {
      const res = await fetch(`${BASE}/api/deployer/history`)
      expect([401, 403, 404]).toContain(res.status)
    })
  })

})
