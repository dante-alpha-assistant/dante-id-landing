# Supabase Schema Isolation

## Problem
User-generated apps share our Supabase instance. Table names conflict (e.g. `projects`).

## Solution: Per-App Schema
- Each deployed app gets its own Postgres schema: `app_{project_slug}_{short_hash}`
- Supabase JS client supports `db: { schema: 'app_testcorp_3bc4' }` in constructor
- Builder generates `CREATE SCHEMA IF NOT EXISTS app_xxx; SET search_path TO app_xxx;` in migration
- Deployer runs migration against our Supabase via Management API before deploy
- `VITE_SUPABASE_SCHEMA` env var set on Vercel project

## Implementation
1. Builder prompt: add schema-aware migration generation
2. Deployer: run migration SQL before Vercel deploy
3. Builder prompt: generated `supabase.ts` uses `db: { schema: import.meta.env.VITE_SUPABASE_SCHEMA }`
4. Vercel env: add `VITE_SUPABASE_SCHEMA` alongside URL + anon key

## RLS
- RLS policies scoped per schema
- `auth.uid()` still works across schemas (Supabase auth is global)

## Priority
P1 — CRUD won't work without this. Blocking real app functionality.
