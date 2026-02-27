# Builder v2: OpenClaw Swarm Agents Architecture

## Status: DESIGN DRAFT
## Date: 2026-02-27
## Author: Neo

---

## Problem

The current Builder makes a single API call to Claude Sonnet 4 via OpenRouter. It sends a blueprint + system prompt → gets back generated files in one JSON blob. No iteration, no file reading, no command execution, no testing. It's a toy.

## Solution

Replace the single-shot Builder with **OpenClaw swarm agents** that spawn **Codex sub-agents** per work order. Each agent can read files, run commands, test code, and iterate — like a real developer.

## Architecture

```
User creates project on dante.id
    │
    ▼
Refinery → Foundry → Planner (existing pipeline, unchanged)
    │
    ▼
POST /api/builder-v2/build-all
    │
    ├─ Fetch all features + blueprints + work orders from Supabase
    ├─ For each feature:
    │   └─ POST to Mu's OpenClaw gateway
    │       └─ sessions_spawn with swarm-coding task
    │           ├─ Codex agent 1: WP-1 (e.g., API endpoints)
    │           ├─ Codex agent 2: WP-2 (e.g., UI components)
    │           └─ Codex agent 3: WP-3 (e.g., tests)
    │
    ├─ Poll sessions for completion (webhook or polling)
    ├─ Collect generated files from agent outputs
    ├─ Store in builds table (Supabase)
    └─ Create PR via platform-apply (existing)
        └─ CI runs → QA dashboard shows results
```

## Worker: Mu's OpenClaw Instance

**Why Mu's VPS, not Neo's:**
- Neo's VPS handles the dante.id API server, CI, QA — can't also run heavy build agents
- Mu's VPS (159.65.235.128) is dedicated to building — already has swarm-coding + Codex configured
- Separates control plane (Neo) from build plane (Mu)

**Connection details:**
- Gateway: `http://159.65.235.128:18789`
- Auth: Bearer token (stored as `OPENCLAW_BUILDER_TOKEN` env var)
- Tool: `sessions_spawn` via `/tools/invoke`

## API Design

### POST /api/builder-v2/generate-code
Replaces the v1 single-shot endpoint.

**Request:**
```json
{
  "project_id": "uuid",
  "feature_id": "uuid",
  "work_order_id": "uuid (optional)"
}
```

**Response (immediate):**
```json
{
  "build_id": "uuid",
  "engine": "openclaw-swarm-v2",
  "agents_spawned": 3,
  "status": "building",
  "poll_url": "/api/builder-v2/{project_id}/builds/{build_id}"
}
```

**Behavior:**
1. Fetches feature + blueprint + work orders from Supabase
2. For internal projects: fetches platform context via `/api/platform/context`
3. Constructs a detailed task prompt including:
   - Blueprint (API design, UI components, data model)
   - Work order tasks
   - Platform context (existing routes, tables, tech stack)
   - Design system rules (dark terminal aesthetic)
4. POSTs to Mu's gateway: `sessions_spawn` with the task
5. Returns immediately with build_id for polling
6. Background worker polls agent session for completion

### POST /api/builder-v2/build-all
Builds all features in parallel.

**Request:**
```json
{ "project_id": "uuid" }
```

**Behavior:**
1. Fetches all features for the project
2. Spawns one build agent per feature (via generate-code)
3. All agents run in parallel on Mu's VPS
4. Returns build IDs for each feature
5. Auto-advances to Inspector when all builds complete

### GET /api/builder-v2/{project_id}/builds/{build_id}
Poll for build status.

**Response:**
```json
{
  "build_id": "uuid",
  "status": "building|done|failed",
  "engine": "openclaw-swarm-v2",
  "progress": "2/3 agents complete",
  "files": [...],
  "logs": [...],
  "agents": [
    { "label": "wp-1-api", "status": "complete", "files_count": 5 },
    { "label": "wp-2-ui", "status": "building", "files_count": 0 },
    { "label": "wp-3-tests", "status": "complete", "files_count": 3 }
  ]
}
```

## Task Prompt Structure

Each Codex agent receives:

```
You are building a feature for dante.id, an AI-native software factory.

## Feature: {feature.name}
{feature.description}

## Blueprint
### API Design
{blueprint.api_design}

### UI Components  
{blueprint.ui_components}

### Data Model
{blueprint.data_model}

## Work Order: {work_order.title}
{work_order.description}

Tasks:
- {task_1}
- {task_2}
- {task_3}

## Platform Context (for internal projects)
Existing API routes: [...]
Existing DB tables: [...]
Existing frontend routes: [...]
Tech stack: React 19, Vite 7, Tailwind 3, Express, Supabase

## Design System
- Background: #0a0a0a
- Accent: #33ff00 (terminal green)
- Font: monospace (JetBrains Mono)
- Borders: sharp edges (rounded-none)
- Buttons: bracket style [ Action ]

## Output
Write all files to the working directory. When complete, output a JSON summary:
{ "files": [{ "path": "...", "content": "..." }], "summary": "..." }
```

## Result Collection

When an agent session completes:
1. Parse the final assistant message for JSON file listings
2. If agent wrote files to disk, read them from the workspace
3. Store files in the `builds` table (JSONB `files` column)
4. Update build status to "done" or "failed"
5. Log agent output to `logs` column

## Scaling Considerations

**MVP (current):** Single Mu VPS handles all builds. Good for 1-5 concurrent builds.

**Phase 2:** Queue-based system
- Build requests go into a Supabase queue table
- Worker fleet (multiple VPSes) polls the queue
- Each worker runs OpenClaw + Codex
- Horizontal scaling by adding VPSes

**Phase 3:** Ephemeral containers
- Spin up Docker containers per build
- Each container runs OpenClaw + Codex
- Auto-teardown after build completes
- Cloud provider handles scaling

## Migration Path

1. **v1 stays as fallback** — `POST /api/builder/generate-code` still works
2. **v2 runs alongside** — `POST /api/builder-v2/generate-code` uses swarm agents
3. **Frontend toggle** — User can choose "Quick Build" (v1) or "Deep Build" (v2)
4. **Gradual migration** — Once v2 is proven, make it the default
5. **Remove v1** — When v2 handles all cases reliably

## Implementation Steps

1. Create `server/builder-v2.js` with OpenClaw gateway client
2. Add `sessions_spawn` and `sessions_history` API helpers
3. Implement `generate-code` with background polling
4. Implement `build-all` with parallel spawning
5. Wire up `server/index.js` to mount at `/api/builder-v2`
6. Add `OPENCLAW_BUILDER_URL` and `OPENCLAW_BUILDER_TOKEN` env vars
7. Test end-to-end: create project → build via v2 → verify files in Supabase
8. Add frontend toggle in Builder UI

## Environment Variables

```
OPENCLAW_BUILDER_URL=http://159.65.235.128:18789
OPENCLAW_BUILDER_TOKEN=<mu-gateway-token>
```

## Dependencies

- No new npm packages needed
- Uses native `fetch()` for OpenClaw API calls
- Supabase client already available
