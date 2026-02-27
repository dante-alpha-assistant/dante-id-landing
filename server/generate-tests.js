#!/usr/bin/env node
/**
 * Test Generator for dante.id platform
 * Fetches /api/platform/context and generates vitest test files for all endpoints.
 * Re-runnable: overwrites existing test files.
 *
 * Usage: node server/generate-tests.js
 * Also exports reusable functions for programmatic use (from builder.js etc.)
 */

import { writeFileSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const TESTS_DIR = join(ROOT, 'tests')

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3001'

// Known public (no-auth) route prefixes
const PUBLIC_PREFIXES = ['/api/platform/', '/api/fleet/']
const QA_PREFIXES = ['/api/qa/']

function isPublic(path) {
  return PUBLIC_PREFIXES.some(p => path.startsWith(p)) || QA_PREFIXES.some(p => path.startsWith(p))
}

function categorize(path) {
  // e.g. /api/auth/signup -> auth
  const parts = path.replace('/api/', '').split('/')
  return parts[0]
}

function parameterize(path) {
  // Replace :param with test-id
  return path.replace(/:[\w]+/g, 'test-id')
}

function generateTestForEndpoint(method, path, isPublicRoute) {
  const realPath = parameterize(path)
  if (isPublicRoute && method === 'GET') {
    return `  describe('${method} ${path}', () => {
    it('returns 200', async () => {
      const res = await fetch(\`\${BASE}${realPath}\`)
      expect(res.status).toBe(200)
    })
    it('returns valid JSON', async () => {
      const res = await fetch(\`\${BASE}${realPath}\`)
      const data = await res.json()
      expect(data).toBeDefined()
    })
  })
`
  }
  if (isPublicRoute && method === 'POST') {
    return `  describe('${method} ${path}', () => {
    it('returns appropriate status with empty body', async () => {
      const res = await fetch(\`\${BASE}${realPath}\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      expect([200, 400, 401, 422]).toContain(res.status)
    })
  })
`
  }
  // Protected endpoint
  if (method === 'GET') {
    return `  describe('${method} ${path}', () => {
    it('returns 401 without auth', async () => {
      const res = await fetch(\`\${BASE}${realPath}\`)
      expect(res.status).toBe(401)
    })
  })
`
  }
  // Protected POST/PUT/DELETE
  return `  describe('${method} ${path}', () => {
    it('returns 401 without auth', async () => {
      const res = await fetch(\`\${BASE}${realPath}\`, {
        method: '${method}',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      expect(res.status).toBe(401)
    })
  })
`
}

/**
 * Generate test file contents for an array of endpoints.
 * @param {Array<{method: string, path: string}>} endpoints
 * @returns {Array<{path: string, content: string}>} test files ready to include in a build
 */
export function generateTestsForEndpoints(endpoints) {
  if (!endpoints || endpoints.length === 0) return []

  // Group by category
  const groups = {}
  for (const ep of endpoints) {
    const cat = categorize(ep.path)
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(ep)
  }

  const testFiles = []
  for (const [category, routes] of Object.entries(groups)) {
    const Name = category.charAt(0).toUpperCase() + category.slice(1)
    let code = `import { describe, it, expect } from 'vitest'\n\n`
    code += `const BASE = process.env.TEST_BASE_URL || 'http://localhost:3001'\n\n`
    code += `describe('${Name} API (generated)', () => {\n`

    for (const route of routes) {
      const method = route.method || 'GET'
      const path = route.path
      const pub = isPublic(path)
      code += generateTestForEndpoint(method, path, pub)
    }

    code += '})\n'
    testFiles.push({
      path: `tests/api/${category}.generated.test.js`,
      content: code
    })
  }

  return testFiles
}

// Re-export helpers for flexibility
export { isPublic, categorize, parameterize, generateTestForEndpoint }

async function main() {
  console.log(`Fetching context from ${BASE_URL}/api/platform/context ...`)
  let context
  try {
    const res = await fetch(`${BASE_URL}/api/platform/context`)
    context = await res.json()
  } catch (e) {
    console.error('Failed to fetch context. Is the server running?', e.message)
    console.log('Generating tests from static definitions instead...')
    context = null
  }

  // Group routes by category
  const groups = {}
  const apiRoutes = context?.api_routes || {}

  // api_routes is an object keyed by category
  for (const [category, routes] of Object.entries(apiRoutes)) {
    if (!groups[category]) groups[category] = []
    if (Array.isArray(routes)) {
      for (const route of routes) {
        groups[category].push(route)
      }
    }
  }

  // Generate test files per category
  mkdirSync(join(TESTS_DIR, 'api'), { recursive: true })
  mkdirSync(join(TESTS_DIR, 'frontend'), { recursive: true })

  let totalEndpoints = 0

  for (const [category, routes] of Object.entries(groups)) {
    const Name = category.charAt(0).toUpperCase() + category.slice(1)
    let code = `import { describe, it, expect } from 'vitest'\n\n`
    code += `const BASE = process.env.TEST_BASE_URL || 'http://localhost:3001'\n\n`
    code += `describe('${Name} API (generated)', () => {\n`

    for (const route of routes) {
      const method = route.method || 'GET'
      const path = route.path || route
      const pub = isPublic(path)
      code += generateTestForEndpoint(method, path, pub)
      totalEndpoints++
    }

    code += '})\n'
    const filePath = join(TESTS_DIR, 'api', `${category}.generated.test.js`)
    writeFileSync(filePath, code)
    console.log(`  ✓ ${filePath} (${routes.length} endpoints)`)
  }

  // Generate frontend route tests
  const frontendRoutes = context?.frontend_routes || []
  if (frontendRoutes.length > 0) {
    let code = `import { describe, it, expect } from 'vitest'\n\n`
    code += `const BASE = process.env.TEST_BASE_URL || 'https://dante.id'\n\n`
    code += `describe('Frontend Routes (generated)', () => {\n`
    for (const route of frontendRoutes) {
      const path = typeof route === 'string' ? route : route.path
      code += `  describe('GET ${path}', () => {\n`
      code += `    it('returns 200', async () => {\n`
      code += `      const res = await fetch(\`\${BASE}${path}\`)\n`
      code += `      expect(res.status).toBe(200)\n`
      code += `    })\n`
      code += `  })\n\n`
      totalEndpoints++
    }
    code += '})\n'
    const filePath = join(TESTS_DIR, 'frontend', 'routes.generated.test.js')
    writeFileSync(filePath, code)
    console.log(`  ✓ ${filePath} (${frontendRoutes.length} routes)`)
  }

  console.log(`\nGenerated tests for ${totalEndpoints} endpoints.`)
  console.log('Run with: npm test')
}

// Run main() only when executed directly (not imported)
const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]
if (isDirectRun) {
  main().catch(console.error)
}
