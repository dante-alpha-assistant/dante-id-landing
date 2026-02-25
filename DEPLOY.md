# DANTE ID — Deployment Guide

## Architecture

- **Frontend**: React + Vite → deployed to Vercel (or any static host)
- **Backend**: Express.js API server (port 3001)
- **Database**: Supabase (PostgreSQL + Auth)
- **Payments**: Stripe (subscriptions)
- **AI**: OpenRouter (Gemini 2.5 Flash)
- **Landing page deploys**: GitHub + Vercel (per-project repos)

---

## Step 1: Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run migrations in order:
   - `supabase/migrations/001_projects.sql`
   - `supabase/migrations/002_waitlist_analytics_domains.sql`
   - `supabase/migrations/003_chat_messages.sql`
   - `supabase/migrations/004_subscriptions.sql`
3. Go to **Settings → API** and note:
   - Project URL → `SUPABASE_URL` / `VITE_SUPABASE_URL`
   - `anon` public key → `VITE_SUPABASE_ANON_KEY`
   - `service_role` secret key → `SUPABASE_SERVICE_KEY`
4. Go to **Authentication → URL Configuration**:
   - Set Site URL to `https://dante.id`
   - Add redirect URLs: `https://dante.id/login`, `http://localhost:5173/login`

---

## Step 2: Stripe Setup

1. Create products in [Stripe Dashboard](https://dashboard.stripe.com):
   - **Pro** plan: $29/mo recurring → copy Price ID → `STRIPE_PRO_PRICE_ID`
   - **Team** plan: $79/mo recurring → copy Price ID → `STRIPE_TEAM_PRICE_ID`
2. Copy Secret Key → `STRIPE_SECRET_KEY`
3. Create a webhook endpoint: `https://your-server.com/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
   - Copy Signing Secret → `STRIPE_WEBHOOK_SECRET`

---

## Step 3: OpenRouter

1. Get API key from [openrouter.ai](https://openrouter.ai)
2. Set `OPENROUTER_API_KEY`
3. Ensure you have credits (uses `google/gemini-2.5-flash`)

---

## Step 4: Environment Variables

Copy `.env.example` to `server/.env` and fill in all values.

For the frontend (Vercel), set these env vars in the Vercel dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## Step 5: Deploy Backend

The Express server needs a Node.js host (Railway, Render, Fly.io, VPS, etc.)

```bash
cd server
npm install
node index.js  # or use pm2: pm2 start index.js --name dante-api
```

Ensure the server is accessible at a public URL (e.g., `https://api.dante.id`).

**Important:** Update `src/lib/api.js` or add a `VITE_API_URL` env var if the API isn't served from the same origin. Currently the frontend calls relative paths (`/api/...`), so you'll need either:
- A reverse proxy (Vercel rewrites, nginx) to proxy `/api/*` → backend
- Or update api calls to use an absolute URL

---

## Step 6: Deploy Frontend

```bash
npm install
npm run build   # outputs to dist/
```

Deploy `dist/` to Vercel:

```bash
vercel --prod
```

Or connect the GitHub repo to Vercel for automatic deploys.

### Vercel Configuration

Add a `vercel.json` for API proxying:

```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://your-api-server.com/api/:path*" }
  ]
}
```

---

## Step 7: Landing Page Deploys (Optional)

For the auto-deploy feature (generated landing pages pushed to GitHub + Vercel):

1. Create a GitHub account/org (e.g., `dante-alpha-assistant`)
2. Set `GH_TOKEN` (needs `repo` scope)
3. Install `gh` CLI on the server
4. Set `VERCEL_TOKEN` for programmatic Vercel deploys
5. Install `vercel` CLI on the server: `npm i -g vercel`

---

## Step 8: Email (Optional)

1. Sign up at [resend.com](https://resend.com)
2. Verify your domain (`dante.id`)
3. Set `RESEND_API_KEY` and `FROM_EMAIL`

---

## Step 9: Custom Domain

1. Point `dante.id` DNS to Vercel (A records: `76.76.21.21`)
2. Add `dante.id` as a custom domain in Vercel project settings
3. For the API subdomain, point `api.dante.id` to your backend host

---

## Quick Checklist

- [ ] Supabase project created + migrations run
- [ ] Supabase Auth configured (site URL, redirects)
- [ ] Environment variables set (server `.env` + Vercel env)
- [ ] Backend deployed and accessible
- [ ] Frontend built and deployed to Vercel
- [ ] Stripe products + webhook configured
- [ ] OpenRouter API key with credits
- [ ] DNS configured for `dante.id`
- [ ] (Optional) GitHub + Vercel tokens for landing page deploys
- [ ] (Optional) Resend for email notifications
- [ ] Test: signup → onboarding → generation → dashboard
