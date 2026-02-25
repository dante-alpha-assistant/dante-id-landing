# dante.id — AI Agent API Documentation

> Software factory API optimized for autonomous AI agent consumption.
> Base URL: `https://dante.id/api`
> Auth: Bearer JWT from Supabase Auth

---

## AUTHENTICATION

### Register / Login
```
POST https://lessxkxujvcmublgwdaa.supabase.co/auth/v1/signup
POST https://lessxkxujvcmublgwdaa.supabase.co/auth/v1/token?grant_type=password
Headers: apikey: <supabase_anon_key>, Content-Type: application/json
Body: { "email": "...", "password": "..." }
Response: { "access_token": "JWT", "user": { "id": "..." } }
```

All `/api/*` endpoints require `Authorization: Bearer <JWT>`.

### GitHub OAuth (optional, for repo creation)
```
GET  /api/auth/github/connect    → { url: "https://github.com/login/oauth/..." }
GET  /api/auth/github/status     → { connected: bool, github_username: string }
DELETE /api/auth/github/disconnect → { disconnected: true }
```
Redirect user to `url` for OAuth. Callback stores encrypted token. Builder uses it for repo creation.

---

## PIPELINE OVERVIEW

```
Refinery → Foundry → Planner → Builder → Inspector → Deployer → Validator
    ↑                                                              |
    └──────────────── feedback loop ◄──────────────────────────────┘
```

Each stage has: generate endpoint (POST), read endpoint (GET), status tracking.
Project status auto-advances: `pending → refining → designed → planning → building → tested → live`

---

## 1. PROJECTS

### Create Project
```
POST /api/projects
Body: { "full_name": "string", "idea": "string", "stage": "idea|building|launched" }
Response: { "project": { "id": "uuid", "status": "pending", ... } }
```

### List Projects
```
GET /api/projects
Response: { "projects": [{ "id", "name", "status", "idea", "created_at", ... }] }
```

---

## 2. REFINERY (PRD + Feature Extraction)

### Generate PRD
```
POST /api/refinery/generate-prd
Body: { "project_id": "uuid", "idea_description": "string", "context": "optional string" }
Response: { "prd": { "id", "content": { "title", "overview", "features", "tech_stack", ... } } }
Timeout: ~40s. Auto-sets project name from PRD title.
```

### Extract Features
```
POST /api/refinery/extract-features
Body: { "project_id": "uuid", "prd_id": "uuid" }
Response: { "features": [{ "id", "name", "description", "priority", "acceptance_criteria" }] }
Timeout: ~20s. Sets project status → "refining".
```

### Read Features
```
GET /api/refinery/:project_id/features
Response: { "features": [...] }
```

### Read PRD
```
GET /api/refinery/:project_id/prd
Response: { "prd": { "id", "content", "version" } }
```

---

## 3. FOUNDRY (Architecture + Blueprints)

Three document types generated in order: Foundation → System Diagrams → Feature Blueprints.

### Generate Foundation (once per project)
```
POST /api/foundry/generate-foundation
Body: { "project_id": "uuid" }
Response: { "foundation": { "content": { "tech_stack", "architecture", "conventions", "security", "constraints", "deployment" } } }
Timeout: ~30s.
```

### Generate System Diagrams (once per project)
```
POST /api/foundry/generate-system-diagrams
Body: { "project_id": "uuid" }
Response: { "system_diagrams": { "content": { "erd": { "mermaid": "..." }, "architecture": { "mermaid": "..." }, "data_flow": { "mermaid": "..." } } } }
Timeout: ~30s. Requires Foundation to exist first for best results.
```

### Generate Feature Blueprint (per feature)
```
POST /api/foundry/generate-blueprint
Body: { "feature_id": "uuid", "project_id": "uuid" }
Response: { "blueprint": { "content": { "api", "ui", "data_model", "tests" } } }
Timeout: ~60s. Sets project status → "designed" when first blueprint created.
```

### Generate All Blueprints
```
POST /api/foundry/generate-all
Body: { "project_id": "uuid" }
Response: { "generated": N, "skipped": M }
Generates blueprints for all features missing them. Parallel (3 concurrent).
```

### Read Documents
```
GET /api/foundry/:project_id/documents   → { "foundation": {...}, "system_diagrams": {...} }
GET /api/foundry/:project_id/blueprints  → { "blueprints": [{ "feature_id", "content", "version" }] }
GET /api/foundry/:project_id/blueprints/:feature_id → { "blueprint": {...} }
```

---

## 4. PLANNER (Work Orders)

### Generate Work Orders (per feature)
```
POST /api/planner/generate-work-orders
Body: { "project_id": "uuid", "feature_id": "uuid", "blueprint_id": "uuid" }
Response: { "work_orders": [{ "title", "description", "phase", "priority", "files_to_create", "files_to_modify", "dependencies", "acceptance_criteria" }] }
Clears existing WOs for that feature before inserting. Timeout: ~40s.
```

### Generate All Work Orders
```
POST /api/planner/generate-all-work-orders
Body: { "project_id": "uuid" }
Response: { "count": N }
Clears ALL project WOs and regenerates for all features. Sets status → "planning".
```

### Read Work Orders
```
GET /api/planner/:project_id/work-orders
Response: { "work_orders": [{ "id", "title", "phase", "priority", "status", "feature_id", "files_to_create", "files_to_modify", "acceptance_criteria", "estimated_complexity" }] }
```

### Update Work Order Status
```
PATCH /api/planner/work-orders/:id/status
Body: { "status": "pending|in_progress|done|blocked" }
```

---

## 5. BUILDER (Code Generation)

### Generate Code (per feature, optionally scoped by work order)
```
POST /api/builder/generate-code
Body: { "feature_id": "uuid", "project_id": "uuid", "work_order_id": "optional uuid" }
Response: { "build": { "id", "files": [{ "path", "content", "language" }], "status": "review" } }
If work_order_id provided: generates code scoped to that WO's file list.
If omitted: fetches all WOs for the feature and includes them as context.
Timeout: ~180s. Sets status → "building".
```

### Generate All
```
POST /api/builder/generate-all
Body: { "project_id": "uuid" }
Generates code for all features without builds. Parallel (3 concurrent).
Auto-creates GitHub repo after completion if GitHub is connected.
```

### Create GitHub Repo
```
POST /api/builder/create-repo
Body: { "project_id": "uuid", "repo_name": "string", "description": "string" }
Response: { "repo_url": "https://github.com/user/repo", "files_committed": N }
Uses user's GitHub token if connected, falls back to service account.
```

### Read Builds
```
GET /api/builder/:project_id/builds → { builds: [{ "build_id", "feature_id", "feature_name", "status", "file_count" }] }
GET /api/builder/:project_id/builds/:feature_id → { "build": { "files": [...], "logs": [...] } }
```

---

## 6. INSPECTOR (AI Code Review + Static Analysis)

### Run Tests
```
POST /api/inspector/run-tests
Body: { "project_id": "uuid", "feature_id": "uuid" }
Response: { "result": { "score", "passed", "failed", "issues": [...], "suggestions": [...] } }
Runs static analysis (syntax, JSON, lint) + AI review. Timeout: ~120s. Sets status → "tested".
```

### Read Results
```
GET /api/inspector/:project_id/results → { results: [{ "feature_id", "score", "passed", "failed" }] }
GET /api/inspector/:project_id/results/:feature_id → { "result": { full detail } }
```

---

## 7. DEPLOYER (Vercel Deployment)

### Deploy
```
POST /api/deployer/deploy
Body: { "project_id": "uuid" }
Response: { "deployment": { "id", "url", "status": "live" } }
Sets status → "live".
```

### Read Deployments
```
GET /api/deployer/:project_id/deployments → { deployments: [{ "id", "url", "status", "created_at" }] }
```

### Rollback
```
POST /api/deployer/rollback
Body: { "deployment_id": "uuid" }
```

---

## 8. VALIDATOR (Feedback Loop)

### Submit Feedback
```
POST /api/validator/submit-feedback
Body: { "project_id": "uuid", "feature_id": "optional uuid", "type": "bug|improvement|question|approval", "title": "string", "description": "optional string" }
Response: { "feedback": { "id", "status": "open" } }
```

### Read Feedback
```
GET /api/validator/:project_id/feedback → { feedback: [{ "id", "type", "title", "status", "features": { "name" } }] }
```

### Update Feedback Status
```
PATCH /api/validator/feedback/:id/status
Body: { "status": "open|in_progress|resolved|wont_fix" }
```

### AI Analysis → Generate Work Orders
```
POST /api/validator/analyze-feedback
Body: { "project_id": "uuid" }
Response: { "tickets": [created work orders], "summary": "string", "feedback_processed": N }
Analyzes open feedback, groups into tickets, creates work orders in Planner.
Marks processed feedback as "in_progress". This closes the feedback loop.
```

---

## COMPLETE E2E FLOW (for AI agents)

```python
# 1. Auth
token = login(email, password)

# 2. Create project
project = POST /api/projects { idea: "..." }

# 3. Refinery
prd = POST /api/refinery/generate-prd { project_id, idea_description }
features = POST /api/refinery/extract-features { project_id, prd_id }

# 4. Foundry (auto-cascades: foundation → diagrams → blueprints)
POST /api/foundry/generate-foundation { project_id }
POST /api/foundry/generate-system-diagrams { project_id }
POST /api/foundry/generate-all { project_id }  # all feature blueprints

# 5. Planner
POST /api/planner/generate-all-work-orders { project_id }

# 6. Builder
POST /api/builder/generate-all { project_id }
POST /api/builder/create-repo { project_id, repo_name }  # if GitHub connected

# 7. Inspector
for feature in features:
    POST /api/inspector/run-tests { project_id, feature_id }

# 8. Deployer
POST /api/deployer/deploy { project_id }

# 9. Validator (feedback loop)
POST /api/validator/submit-feedback { project_id, type: "improvement", title: "..." }
POST /api/validator/analyze-feedback { project_id }  # → creates new work orders
# Loop back to step 5 (Planner) for next iteration
```

---

## RATE LIMITS
- AI endpoints: 5 requests/minute per IP
- Read endpoints: unlimited
- Auth: standard Supabase limits

## TIMEOUTS
- Refinery: 120s
- Foundry: 120s per blueprint
- Planner: 240s
- Builder: 180s per feature
- Inspector: 120s
- Nginx proxy: 300s

## ERROR HANDLING
All errors return `{ "error": "message" }` with appropriate HTTP status codes.
Common: 400 (bad params), 401 (no/bad token), 403 (not your project), 404 (not found), 429 (rate limited), 500 (server error).
