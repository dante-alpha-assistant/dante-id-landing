# dante.id — AI Agent API Reference

> This documentation is optimized for AI agents. It contains everything needed to use dante.id end-to-end via API to create software from an idea.

## QUICK START (E2E WORKFLOW)

```
1. POST /api/auth/signup        → Create account → { token }
2. POST /api/auth/login         → Get JWT        → { token }
3. POST /api/onboarding/start   → Create project → { project_id }
4. POST /api/refinery/generate-prd     → Generate PRD from idea
5. POST /api/refinery/extract-features → Extract features from PRD
6. POST /api/foundry/generate-foundation      → Architecture doc
7. POST /api/foundry/generate-system-diagrams → ERD + diagrams
8. POST /api/foundry/generate-blueprint       → Per-feature blueprint (repeat for each feature)
9. POST /api/planner/generate-all-work-orders → Work orders for all features
10. POST /api/builder/generate-code           → Code gen per feature (repeat)
11. POST /api/inspector/run-tests             → AI QA per feature (repeat)
12. POST /api/auth/github/connect             → Connect user's GitHub (OAuth)
13. POST /api/builder/create-repo             → Push code to user's GitHub
14. POST /api/deployer/deploy                 → Deploy to production
```

All endpoints require `Authorization: Bearer <jwt_token>` unless noted.
All request/response bodies are JSON. Set `Content-Type: application/json`.
Long-running endpoints (PRD, blueprints, code gen) may take 30-120 seconds.

---

## AUTHENTICATION

### Sign Up
```
POST /api/auth/signup
Body: { "email": "user@example.com", "password": "min8chars" }
Response: { "token": "jwt...", "user": { "id": "uuid", "email": "..." } }
```

### Log In
```
POST /api/auth/login  
Body: { "email": "user@example.com", "password": "..." }
Response: { "token": "jwt...", "user": { "id": "uuid", "email": "..." } }
```

Use the token in all subsequent requests:
```
Authorization: Bearer <token>
```

---

## PROJECT LIFECYCLE

### Create Project (Onboarding)
```
POST /api/onboarding/start
Body: { 
  "idea": "A habit tracker app with streaks and gamification",
  "name": "HabitTrack",
  "stage": "idea"    // "idea" | "building" | "launched"
}
Response: { "project_id": "uuid", "name": "HabitTrack" }
```

### List Projects
```
GET /api/projects
Response: [{ "id": "uuid", "name": "...", "status": "pending", "created_at": "..." }, ...]
```

### Project Status Values (auto-updated by pipeline)
```
pending  → Project created, nothing done
refining → Refinery complete (PRD + features exist)
designed → Foundry complete (blueprints exist)  
planning → Planner complete (work orders exist)
building → Builder complete (code generated)
tested   → Inspector complete (tests run)
live     → Deployer complete (deployed)
```

---

## MODULE 1: REFINERY (Idea → PRD → Features)

### Generate PRD
```
POST /api/refinery/generate-prd
Body: { "project_id": "uuid" }
Note: Uses the idea from onboarding. Takes ~40 seconds.
Response: { "prd": { "content": "...", "sections": [...] } }
```

### Get PRD
```
GET /api/refinery/:project_id/prd
Response: { "content": "markdown PRD", "sections": [...] }
```

### Update PRD
```
PUT /api/refinery/:project_id/prd
Body: { "content": "updated markdown" }
```

### Refine PRD (AI iteration)
```
POST /api/refinery/refine
Body: { "project_id": "uuid", "feedback": "Add mobile support" }
Response: { "prd": { "content": "refined markdown..." } }
```

### Extract Features
```
POST /api/refinery/extract-features
Body: { "project_id": "uuid" }
Note: Takes ~19 seconds. Generates 4-8 discrete features.
Response: { "features": [{ "id": "uuid", "name": "...", "description": "...", "sort_order": 1 }, ...] }
```

### Get Features
```
GET /api/refinery/:project_id/features
Response: [{ "id": "uuid", "name": "...", "description": "...", "sort_order": 1 }, ...]
```

### Update Features
```
PUT /api/refinery/:project_id/features
Body: { "features": [{ "id": "uuid", "name": "...", "description": "..." }] }
```

---

## MODULE 2: FOUNDRY (Features → Architecture → Blueprints)

### Generate Foundation (project-wide architecture)
```
POST /api/foundry/generate-foundation
Body: { "project_id": "uuid" }
Response: { "document": { "id": "uuid", "type": "foundation", "content": "..." } }
```

### Generate System Diagrams (ERD + architecture)
```
POST /api/foundry/generate-system-diagrams
Body: { "project_id": "uuid" }
Response: { "document": { "id": "uuid", "type": "system_diagrams", "content": "..." } }
```

### Generate Feature Blueprint
```
POST /api/foundry/generate-blueprint
Body: { "project_id": "uuid", "feature_id": "uuid" }
Note: Takes ~65 seconds per feature. Generate for each feature.
Response: { "blueprint": { "id": "uuid", "feature_id": "uuid", "content": "..." } }
```

### Get All Documents (foundation + diagrams)
```
GET /api/foundry/:project_id/documents
Response: [{ "id": "uuid", "type": "foundation|system_diagrams", "content": "..." }]
```

### Get All Blueprints
```
GET /api/foundry/:project_id/blueprints
Response: [{ "id": "uuid", "feature_id": "uuid", "content": "...", "status": "complete" }]
```

### Get Single Blueprint
```
GET /api/foundry/:project_id/blueprints/:feature_id
Response: { "id": "uuid", "feature_id": "uuid", "content": "..." }
```

### Refine Blueprint (AI iteration)
```
POST /api/foundry/refine-blueprint
Body: { "project_id": "uuid", "feature_id": "uuid", "feedback": "Add caching layer" }
Response: { "blueprint": { "content": "refined..." } }
```

---

## MODULE 3: PLANNER (Blueprints → Work Orders)

### Generate Work Orders for Single Feature
```
POST /api/planner/generate-work-orders
Body: { "project_id": "uuid", "feature_id": "uuid" }
Response: { "work_orders": [{ "id": "uuid", "title": "...", "phase": 1, "files_to_create": [...], "files_to_modify": [...], "acceptance_criteria": [...] }] }
```

### Generate Work Orders for ALL Features
```
POST /api/planner/generate-all-work-orders
Body: { "project_id": "uuid" }
Note: Takes ~33 seconds. Generates 3-6 work orders per feature, phased.
Response: { "work_orders": [...] }
```

### Get Work Orders
```
GET /api/planner/:project_id/work-orders
Response: [{ "id": "uuid", "feature_id": "uuid", "title": "...", "description": "...", "phase": 1, "status": "pending", "files_to_create": [...], "files_to_modify": [...], "acceptance_criteria": [...] }]
```

### Update Work Order Status
```
PATCH /api/planner/work-orders/:id/status
Body: { "status": "in_progress" | "completed" | "pending" }
```

---

## MODULE 4: BUILDER (Work Orders → Code)

### Generate Code
```
POST /api/builder/generate-code
Body: { 
  "project_id": "uuid", 
  "feature_id": "uuid",
  "work_order_id": "uuid"  // optional, scopes code gen to specific WO
}
Note: Takes ~90 seconds. Generates scaffolding + core logic.
Response: { "build": { "id": "uuid", "feature_id": "uuid", "files": [{ "path": "src/...", "content": "..." }], "status": "complete" } }
```

### Get All Builds
```
GET /api/builder/:project_id/builds
Response: [{ "id": "uuid", "feature_id": "uuid", "status": "complete", "files": [...] }]
```

### Get Feature Build  
```
GET /api/builder/:project_id/builds/:feature_id
Response: { "id": "uuid", "files": [{ "path": "...", "content": "..." }] }
```

### Create GitHub Repo (requires GitHub OAuth connection)
```
POST /api/builder/create-repo
Body: { "project_id": "uuid", "repo_name": "my-app" }
Note: Creates repo in the user's connected GitHub account. Commits all generated files.
Response: { "repo_url": "https://github.com/username/my-app", "files_committed": 8 }
```

---

## MODULE 5: INSPECTOR (Code → Test Results)

### Run Tests
```
POST /api/inspector/run-tests
Body: { "project_id": "uuid", "feature_id": "uuid" }
Note: Takes ~30 seconds. AI reviews code against blueprint.
Response: { "result": { "id": "uuid", "feature_id": "uuid", "score": 72, "status": "failed", "issues": [...], "suggestions": [...] } }
```

### Get All Results
```
GET /api/inspector/:project_id/results
Response: [{ "id": "uuid", "feature_id": "uuid", "score": 72, "status": "passed|failed", "issues": [...] }]
```

### Get Feature Results
```
GET /api/inspector/:project_id/results/:feature_id
Response: { "score": 72, "status": "failed", "issues": [...], "suggestions": [...] }
```

### Get Fix Suggestion
```
POST /api/inspector/fix-suggestion
Body: { "project_id": "uuid", "feature_id": "uuid", "issue_id": "uuid" }
Response: { "suggestion": { "description": "...", "code_changes": [...] } }
```

---

## MODULE 6: DEPLOYER (Code → Production)

### Deploy
```
POST /api/deployer/deploy
Body: { "project_id": "uuid" }
Response: { "deployment": { "id": "uuid", "url": "https://...", "status": "live" } }
```

### Get Deployments
```
GET /api/deployer/:project_id/deployments
Response: [{ "id": "uuid", "url": "...", "status": "live", "created_at": "..." }]
```

### Rollback
```
POST /api/deployer/rollback
Body: { "project_id": "uuid", "deployment_id": "uuid" }
```

---

## GITHUB INTEGRATION

### Check Connection Status
```
GET /api/auth/github/status
Response: { "connected": true, "github_username": "octocat" }
  OR:     { "connected": false }
```

### Connect GitHub (OAuth flow)
```
GET /api/auth/github/connect
Response: { "url": "https://github.com/login/oauth/authorize?..." }
Note: Redirect user to this URL. After authorization, GitHub calls back 
      to /api/auth/github/callback which stores the encrypted token.
```

### Disconnect GitHub
```
DELETE /api/auth/github/disconnect
Response: { "success": true }
```

---

## COMPLETE E2E SCRIPT (for AI agents)

```python
import requests, time

BASE = "https://dante.id/api"

# 1. Auth
r = requests.post(f"{BASE}/auth/signup", json={"email": "agent@example.com", "password": "securepass123"})
token = r.json()["token"]
h = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

# 2. Create project
r = requests.post(f"{BASE}/onboarding/start", json={"idea": "A habit tracker with streaks and social accountability", "name": "HabitFlow", "stage": "idea"}, headers=h)
pid = r.json()["project_id"]

# 3. Refinery
requests.post(f"{BASE}/refinery/generate-prd", json={"project_id": pid}, headers=h, timeout=120)
requests.post(f"{BASE}/refinery/extract-features", json={"project_id": pid}, headers=h, timeout=60)
features = requests.get(f"{BASE}/refinery/{pid}/features", headers=h).json()

# 4. Foundry
requests.post(f"{BASE}/foundry/generate-foundation", json={"project_id": pid}, headers=h, timeout=120)
requests.post(f"{BASE}/foundry/generate-system-diagrams", json={"project_id": pid}, headers=h, timeout=120)
for f in features:
    requests.post(f"{BASE}/foundry/generate-blueprint", json={"project_id": pid, "feature_id": f["id"]}, headers=h, timeout=120)

# 5. Planner
requests.post(f"{BASE}/planner/generate-all-work-orders", json={"project_id": pid}, headers=h, timeout=120)

# 6. Builder
for f in features:
    requests.post(f"{BASE}/builder/generate-code", json={"project_id": pid, "feature_id": f["id"]}, headers=h, timeout=180)

# 7. Inspector
for f in features:
    requests.post(f"{BASE}/inspector/run-tests", json={"project_id": pid, "feature_id": f["id"]}, headers=h, timeout=60)

# 8. GitHub + Deploy
requests.post(f"{BASE}/builder/create-repo", json={"project_id": pid, "repo_name": "habitflow"}, headers=h)
requests.post(f"{BASE}/deployer/deploy", json={"project_id": pid}, headers=h)
```

---

## TIMING EXPECTATIONS

| Operation | Typical Duration |
|-----------|-----------------|
| Generate PRD | ~40 seconds |
| Extract Features | ~19 seconds |
| Generate Foundation | ~30 seconds |
| Generate System Diagrams | ~30 seconds |
| Generate Blueprint (per feature) | ~65 seconds |
| Generate All Work Orders | ~33 seconds |
| Generate Code (per feature) | ~90 seconds |
| Run Tests (per feature) | ~30 seconds |
| Create GitHub Repo | ~5 seconds |
| Deploy | ~15 seconds |
| **Full E2E (6 features)** | **~12-15 minutes** |

Set HTTP timeouts to at least 180 seconds for generation endpoints.

---

## RATE LIMITS
- AI generation endpoints: 1 concurrent request per user
- Auth endpoints: 10 requests/minute
- Read endpoints (GET): No limit

## ERROR RESPONSES
```json
{ "error": "Error message description" }
```
HTTP status codes: 400 (bad request), 401 (unauthorized), 404 (not found), 429 (rate limited), 500 (server error), 504 (timeout)

---

## BASE URL
```
https://dante.id/api
```

## PLATFORM
dante.id — AI-native software factory. From idea to deployed production software.
