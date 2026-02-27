import { describe, it, expect } from 'vitest'

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3001'

describe('Fleet API', () => {
  describe('GET /api/fleet/status', () => {
    it('returns 200', async () => {
      const res = await fetch(`${BASE}/api/fleet/status`)
      expect(res.status).toBe(200)
    })
    it('returns valid JSON', async () => {
      const res = await fetch(`${BASE}/api/fleet/status`)
      const data = await res.json()
      expect(data).toBeDefined()
    })
  })

  describe('GET /api/fleet/agents', () => {
    it('returns 200', async () => {
      const res = await fetch(`${BASE}/api/fleet/agents`)
      expect(res.status).toBe(200)
    })
  })

  describe('GET /api/fleet/agents/:id', () => {
    it('returns 200', async () => {
      const res = await fetch(`${BASE}/api/fleet/agents/test-id`)
      expect(res.status).toBe(200)
    })
  })

  describe('POST /api/fleet/agents/:id/task', () => {
    it('returns appropriate status with empty body', async () => {
      const res = await fetch(`${BASE}/api/fleet/agents/test-id/task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      expect([200, 400, 401, 422]).toContain(res.status)
    })
  })

  describe('GET /api/fleet/tasks', () => {
    it('returns 200', async () => {
      const res = await fetch(`${BASE}/api/fleet/tasks`)
      expect(res.status).toBe(200)
    })
  })

  describe('GET /api/fleet/tasks/:id', () => {
    it('returns 200', async () => {
      const res = await fetch(`${BASE}/api/fleet/tasks/test-id`)
      expect(res.status).toBe(200)
    })
  })

  describe('POST /api/fleet/heartbeat', () => {
    it('returns appropriate status', async () => {
      const res = await fetch(`${BASE}/api/fleet/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      expect([200, 400, 401, 422]).toContain(res.status)
    })
  })
})
