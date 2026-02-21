# DANTE ID - Deployment Guide

## Prerequisites

- Supabase project (database + auth)
- Stripe account (payments)
- Resend account (emails)
- Vercel account (frontend hosting)
- Railway/Render/Fly account (backend hosting)
- GitHub account (repo automation)

## Step 1: Supabase Setup

1. Create new Supabase project at https://supabase.com
2. Go to SQL Editor
3. Run all migrations in `supabase/migrations/` in order:
   - `001_initial_schema.sql` (if exists)
   - `002_deliverables_constraint.sql` (if exists)
   - `003_chat_messages.sql`
   - `004_subscriptions.sql`
   - `005_analytics_events.sql` (create below)
   - `006_custom_domains.sql` (create below)

### Migration 005: Analytics Events
```sql
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  url TEXT,
  referrer TEXT,
  session_id TEXT,
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_project_id ON analytics_events(project_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
```

### Migration 006: Custom Domains
```sql
CREATE TABLE IF NOT EXISTS custom_domains (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  domain TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'error')),
  verification JSONB,
  dns_config JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custom_domains_project_id ON custom_domains(project_id);

ALTER TABLE custom_domains ENABLE ROW LEVEL SECURITY;
```

## Step 2: Environment Variables

1. Copy `.env.example` to `.env`
2. Fill in all values from your service dashboards

### Getting Keys:

**Supabase:**
- Project Settings > API > Project URL (SUPABASE_URL)
- Project Settings > API > service_role key (SUPABASE_SERVICE_KEY)
- Project Settings > API > anon public key (SUPABASE_ANON_KEY)

**OpenRouter:**
- https://openrouter.ai/keys

**Stripe:**
- Developers > API keys > Secret key
- Developers > Webhooks > Add endpoint > Signing secret
- Products > Create products > Copy Price IDs for Pro ($29) and Team ($79)

**Resend:**
- https://resend.com/api-keys

**Vercel:**
- Settings > Tokens

**GitHub:**
- Settings > Developer settings > Personal access tokens (classic)
- Needs `repo` scope

## Step 3: Backend Deployment

### Option A: Railway (Recommended)

1. Install Railway CLI: `npm i -g @railway/cli`
2. Login: `railway login`
3. Create project: `railway init`
4. Add all env vars in Railway dashboard
5. Deploy: `cd server && railway up`

### Option B: Render

1. Create new Web Service
2. Connect GitHub repo
3. Set root directory to `server`
4. Add all env vars
5. Deploy

### Option C: Fly.io

```bash
cd server
fly launch
fly secrets set SUPABASE_URL=... SUPABASE_SERVICE_KEY=... etc.
fly deploy
```

## Step 4: Frontend Deployment (Vercel)

1. Connect GitHub repo at https://vercel.com
2. Framework preset: Vite
3. Root directory: `/` (not `/src`)
4. Build command: `npm run build`
5. Output directory: `dist`
6. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_URL` (your backend URL)

## Step 5: Stripe Webhook

1. Stripe Dashboard > Developers > Webhooks
2. Add endpoint: `https://your-backend.com/api/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy signing secret to `STRIPE_WEBHOOK_SECRET`

## Step 6: Post-Deploy Verification

Checklist:
- [ ] User can sign up/login
- [ ] Project onboarding works
- [ ] All 7 deliverables generate
- [ ] Landing page deploys to Vercel
- [ ] Stripe checkout works
- [ ] Email sends on completion
- [ ] AI chat responds with context
- [ ] Analytics receive events

## Troubleshooting

### "relation does not exist"
- Run SQL migrations in Supabase

### "Invalid API key"
- Check OPENROUTER_API_KEY is set and valid

### "Stripe signature verification failed"
- Ensure STRIPE_WEBHOOK_SECRET matches Stripe dashboard

### Landing pages not deploying
- Check VERCEL_TOKEN and GH_TOKEN are valid
- Verify GitHub repo has correct permissions

## Maintenance

**Database Backups:**
- Supabase does daily backups automatically

**Monitoring:**
- Check Railway/Render/Fly dashboards for errors
- Stripe dashboard for payment issues
- Vercel dashboard for frontend errors

**Updates:**
```bash
git pull origin main
npm install
npm run build
# Deploy updated backend + frontend
```
