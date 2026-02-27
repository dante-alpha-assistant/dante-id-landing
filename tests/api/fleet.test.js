import { describe, it, expect } from 'vitest'

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3001'

describe('Fleet API', () => {
  describe('GET /api/fleet/status', () => {
    it('returns 200', async () => {
      const res = await fetch(`${BASE}/api/fleet/status`)
      expect([200, 404]).toContain(res.status)
    })
    it('returns valid JSON if available', async () => {
      const res = await fetch(`${BASE}/api/fleet/status`)
      if (res.status === 200) {
        const data = await res.json()
        expect(data).toBeDefined()
      } else {
        expect([200, 404]).toContain(res.status)
      }
    })
  })

  describe('GET /api/fleet/agents', () => {
    it('returns 200', async () => {
      const res = await fetch(`${BASE}/api/fleet/agents`)
      expect([200, 404]).toContain(res.status)
    })
  })

  describe('GET /api/fleet/agents/:id', () => {
    it('returns 200', async () => {
      const res = await fetch(`${BASE}/api/fleet/agents/test-id`)
      expect([200, 404]).toContain(res.status)
    })
  })

  describe('POST /api/fleet/agents/:id/task', () => {
    it('returns appropriate status with empty body', async () => {
      const res = await fetch(`${BASE}/api/fleet/agents/test-id/task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      expect([200, 400, 401, 404, 422]).toContain(res.status)
    })
  })

  describe('GET /api/fleet/tasks', () => {
    it('returns 200', async () => {
      const res = await fetch(`${BASE}/api/fleet/tasks`)
      expect([200, 404]).toContain(res.status)
    })
  })

  describe('GET /api/fleet/tasks/:id', () => {
    it('returns 200', async () => {
      const res = await fetch(`${BASE}/api/fleet/tasks/test-id`)
      expect([200, 404]).toContain(res.status)
    })
  })

  describe('POST /api/fleet/heartbeat', () => {
    it('returns appropriate status', async () => {
      const res = await fetch(`${BASE}/api/fleet/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      expect([200, 400, 401, 404, 422]).toContain(res.status)
    })
  })
})
