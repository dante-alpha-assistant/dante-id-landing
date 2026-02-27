# Platform API Reference

dante.id's self-building infrastructure. All endpoints require `Authorization: Bearer <SUPABASE_SERVICE_KEY>` or a valid user token.

Base URL: `https://api.dante.id` (or `http://localhost:3001` locally)

---

## 1. `/api/platform/context` (GET)

**Purpose:** Returns the full structure of the dante.id codebase — routes, tables, files, design system. Used by the Builder to generate context-aware code for internal projects.

**Auth:** None (public, read-only)

**Response:**
```json
{
  "api_routes": { "auth": [...], "projects": [...], ... },
  "frontend_routes": ["/", "/login", "/dashboard", ...],
  "database_schema": ["projects", "builds", "features", ...],
  "project_structure": ["server/index.js", "src/App.jsx", ...],
  "design_system": { "colors": {...}, "fonts": {...} },
  "tech_stack": { "frontend": "React 19 + Vite 7", ... },
  "pipeline_steps": ["refinery", "foundry", "planner", "builder", "inspector", "deployer"]
}
```

---

## 2. `/api/platform/apply` (POST)

**Purpose:** Takes builds from an internal project, filters scaffold files, and creates a GitHub PR against `dante-id-landing`.

**Body:** `{ "project_id": "<uuid>" }`

**Response:**
```json
{
  "success": true,
  "pr_url": "https://github.com/dante-alpha-assistant/dante-id-landing/pull/55",
  "branch": "internal/6bb65fc9",
  "files_written": ["src/components/MyComponent.jsx", ...],
  "files_skipped": ["server/analytics.js"]
}
```

**Key behaviors:**
- Only allows files in: `src/components/`, `src/pages/`, `src/contexts/`, `src/hooks/`, `src/lib/`, `src/utils/`, `server/*.js`, `supabase/migrations/`
- Blocks 20+ scaffold files (index.html, App.tsx, vite.config, etc.)
- Skips files that already exist in the repo (duplicate check)

**Also supports:**
- `GET /api/platform/apply/preview/:project_id` — preview files without creating PR
- `GET /api/platform/apply/status/:project_id` — check PR status

---

## 3. `/api/platform/status` (GET)

**Purpose:** Dashboard view of all internal projects — pipeline stage, build status, inspector results, deploy/PR links.

**Response:**
```json
{
  "projects": [{
    "id": "...",
    "name": "Navigation Bar",
    "pipeline_stage": "tested",
    "build": { "status": "review", ... },
    "inspector": { "status": "passed", "issues": 0 },
    "deploy": { "pr_url": "https://github.com/..." }
  }],
  "stats": { "total": 3, "applied": 2, "pending": 1 }
}
```

---

## 4. `/api/platform/analytics` (GET)

**Purpose:** Metrics and trends for the self-building pipeline.

**Response:**
```json
{
  "summary": {
    "projects": { "total": 3, "completed": 2, "completion_rate": 67 },
    "builds": { "total": 12, "success_rate": 85 },
    "inspections": { "total": 6, "pass_rate": 83 },
    "deployments": { "total": 4, "success_rate": 100 }
  },
  "avg_build_duration_min": 4.2,
  "trends": [{ "date": "2026-02-27", "builds": 3, "inspections": 2, "deploys": 1 }]
}
```

---

## 5. `/api/platform/health` (GET)

**Purpose:** Pipeline health score and failure tracking.

**Response:**
```json
{
  "summary": {
    "prs_created": 7,
    "prs_merged": 2,
    "prs_rejected": 3,
    "success_rate_percent": 29,
    "rejection_rate_percent": 43
  },
  "recent_failures": {
    "inspections": [{ "issues": 2, "error": "broken imports" }]
  },
  "health_score": 51
}
```

---

## 6. `/api/platform/test-pipeline` (POST)

**Purpose:** E2E smoke test — creates a test project, runs all pipeline stages in dry-run mode, returns pass/fail per stage.

**Response:**
```json
{
  "success": true,
  "test_id": "test-1740614400000",
  "results": {
    "overall": "passed",
    "stages": {
      "project_creation": { "status": "passed" },
      "refinery": { "status": "passed" },
      "foundry": { "status": "passed" },
      "planner": { "status": "passed" },
      "builder": { "status": "passed", "builds_successful": 2 },
      "inspector": { "status": "passed" },
      "platform_apply": { "status": "passed", "files_found": 5 }
    },
    "duration_ms": 45000
  }
}
```

**Also used by:** GitHub Actions CI (`smoke-test.yml`) — blocks PRs that fail.

---

## 7. `/api/platform/self-improve` (POST)

**Purpose:** AI analyzes the platform and creates 1-2 improvement ideas as internal projects. Currently **disabled** (cron paused).

**Response:**
```json
{
  "success": true,
  "projects_created": 2,
  "projects": [
    { "id": "...", "name": "Quick Actions Menu", "description": "..." }
  ]
}
```

`GET /api/platform/self-improve` — lists recent self-improvement projects.

---

## Pipeline Flow (Internal Projects)

```
Idea → Refinery (PRD) → Features (1-3 for internal) → Foundry (blueprints)
  → Planner (work orders) → Builder (context-aware code) → Inspector (quality gate)
  → platform/apply (scaffold filter + PR creation) → GitHub PR → CI smoke test
```
