# SecureVote ? Deployment Guide

## 1. Supabase Setup

### Create Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your **Project URL** and **API keys** from Settings > API

### Run SQL Migrations (in order)
Open Supabase Dashboard > SQL Editor and run each file:
```
backend/database/schema.sql    # Tables, enums, indexes
backend/database/rls.sql       # Row Level Security policies
backend/database/functions.sql # Triggers, RPCs, realtime
```

### Configure Auth
- Dashboard > Authentication > Settings
- Set **Site URL** to your Vercel domain
- Add redirect URLs: `https://your-domain.vercel.app/auth/callback`
- Enable Email confirmations

### Deploy Edge Functions
Install Supabase CLI: `npm install -g supabase`
```bash
supabase login
supabase link --project-ref your-project-id
supabase functions deploy send-secret-id
supabase functions deploy lock-expired-elections
```

Set Edge Function secrets:
```bash
supabase secrets set RESEND_API_KEY=re_your_key
supabase secrets set NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
supabase secrets set EMAIL_DOMAIN=your-domain.com
```

### Schedule the lock-expired-elections function
Dashboard > Edge Functions > lock-expired-elections > Schedules
Add cron: `*/5 * * * *` (every 5 minutes)

## 2. Resend Setup
1. Create account at [resend.com](https://resend.com)
2. Add and verify your sending domain
3. Create an API key

## 3. Vercel Deployment

### Environment Variables
Add these in Vercel Dashboard > Settings > Environment Variables:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project-id.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key (secret) |
| `NEXT_PUBLIC_APP_URL` | `https://your-domain.vercel.app` |
| `RESEND_API_KEY` | `re_your_resend_api_key` |
| `EMAIL_DOMAIN` | `your-domain.com` |

### Deploy
```bash
git push origin main
# Vercel auto-deploys on push
```

## 4. Create Super Admin
After deploying, create your first admin user:
1. Sign up normally at `/signup`
2. In Supabase SQL Editor, run:
```sql
UPDATE public.profiles
SET role = 'super_admin'
WHERE email = 'your-admin@email.com';
```

## 5. Architecture Overview

```
Frontend (Next.js App Router)
??? /app/page.tsx              Landing page with realtime election list
??? /app/login                 Supabase Auth sign-in
??? /app/signup                Supabase Auth sign-up
??? /app/creator-request       Submit creator application
??? /app/admin                 Super Admin dashboard (approve/reject creators)
??? /app/creator               Election Creator dashboard
??? /app/election/[id]         Voting flow (register ? secret ID ? vote)
??? /app/results/[id]          Live results with Recharts
??? /app/auth/callback         OAuth/email confirmation handler

Backend (Supabase)
??? Database
?   ??? profiles               Users with roles (super_admin, election_creator, voter)
?   ??? elections              Election records with status machine
?   ??? candidates             Candidates per election
?   ??? registrations          Voter-election links + secret POLL-XXXX IDs
?   ??? votes                  Anonymous vote records (no voter_id)
?   ??? creator_requests       Creator access applications
?   ??? audit_logs             Immutable action log
??? RLS Policies               Row-level security on all tables
??? RPCs
?   ??? cast_vote              Atomic vote with duplicate prevention
?   ??? verify_secret_id       Validate POLL-XXXX before ballot access
?   ??? admin_override_max_voters  Increase capacity + admit waitlist
?   ??? approve_creator_request    Promote user to election_creator
?   ??? reject_creator_request     Reject with reason
??? Edge Functions
    ??? send-secret-id         Generate POLL-XXXX IDs + email voters
    ??? lock-expired-elections  Cron: auto-complete past-deadline elections
```