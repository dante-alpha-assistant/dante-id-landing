import { describe, it, expect } from 'vitest'

const BASE = process.env.TEST_FRONTEND_URL || 'https://dante.id'

const routes = [
  '/',
  '/login',
  '/signup',
  '/onboarding',
  '/dashboard',
  '/qa/dashboard',
  '/projects',
  '/projects/new',
  '/refinery',
  '/foundry',
  '/planner',
  '/builder',
  '/inspector',
  '/deployer',
  '/fleet',
  '/settings',
  '/docs',
]

describe('Frontend Routes', () => {
  routes.forEach(route => {
    describe(`GET ${route}`, () => {
      it('returns 200', async () => {
        const res = await fetch(`${BASE}${route}`)
        expect(res.status).toBe(200)
      })
    })
  })
})
