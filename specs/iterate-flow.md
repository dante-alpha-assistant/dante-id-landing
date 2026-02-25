# Iterate Flow — Post-Deploy Iteration

## Problem
Projects at status=live (6/6) have no way to iterate. Users are stuck after first deploy.

## UX Flow
1. Dashboard shows `[ ITERATE → ]` button for live projects (instead of "CONTINUE → DASHBOARD")
2. User describes what they want to change (free text, like mini-Refinery)
3. System generates diff work orders against existing codebase
4. Builder applies changes to existing files (not from scratch)
5. Push to same GitHub repo → Vercel auto-deploys

## Implementation
- New endpoint: `POST /api/iterate/:project_id` — takes `{ description }`, generates targeted work orders
- Reuses Planner + Builder but in "patch mode" — context includes existing build files
- Status cycle: `live` → `iterating` → `building` → `tested` → `live`
- Frontend: iteration history panel on Dashboard for live projects

## Key Decisions
- Iteration = new cycle through Planner → Builder → Inspector → Deployer
- Existing code passed as context to AI (not starting from scratch)
- Each iteration creates a new set of work orders linked to the iteration request
- Git: each iteration = new commit on same repo

## Priority
P1 — core product stickiness. Without this, dante.id is a one-shot generator.
