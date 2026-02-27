import { describe, it, expect } from 'vitest'

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3001'
const PROJECT_ID = '91607ad6-bacc-4ea9-8d58-007d984016f2'

describe('QA Dashboard API', () => {
  describe('GET /api/qa/global/overview', () => {
    it('returns 200', async () => {
      const res = await fetch(`${BASE}/api/qa/global/overview`)
      expect(res.status).toBe(200)
    })
    it('has platform and projects keys', async () => {
      const res = await fetch(`${BASE}/api/qa/global/overview`)
      const data = await res.json()
      expect(data).toHaveProperty('platform')
      expect(data).toHaveProperty('projects')
    })
  })

  describe('GET /api/qa/global/project/:id', () => {
    it('returns 200 for valid project', async () => {
      const res = await fetch(`${BASE}/api/qa/global/project/${PROJECT_ID}`)
      expect(res.status).toBe(200)
    })
  })

  describe('GET /api/qa/global/project/:id/failures', () => {
    it('returns 200 for valid project', async () => {
      const res = await fetch(`${BASE}/api/qa/global/project/${PROJECT_ID}/failures`)
      expect(res.status).toBe(200)
    })
  })
})
