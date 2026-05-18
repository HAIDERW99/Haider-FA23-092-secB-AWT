-- ============================================================
-- SecureVote Database Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE user_role AS ENUM ('super_admin', 'election_creator', 'voter');
CREATE TYPE election_status AS ENUM ('draft', 'active', 'locked', 'completed', 'cancelled');
CREATE TYPE registration_status AS ENUM ('registered', 'waitlisted', 'admitted', 'rejected');
CREATE TYPE creator_request_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE audit_action AS ENUM (
  'election_created', 'election_updated', 'election_started', 'election_ended',
  'election_locked', 'voter_registered', 'voter_waitlisted', 'voter_admitted',
  'vote_cast', 'admin_override', 'creator_approved', 'creator_rejected',
  'secret_id_generated', 'secret_id_verified'
);

-- ============================================================
-- PROFILES TABLE
-- Extends Supabase auth.users with role and metadata
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  full_name     TEXT,
  role          user_role NOT NULL DEFAULT 'voter',
  organization  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CREATOR REQUESTS TABLE
-- Stores applications to become an election creator
-- ============================================================
CREATE TABLE IF NOT EXISTS public.creator_requests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_id      TEXT UNIQUE NOT NULL DEFAULT 'CR-' || TO_CHAR(NOW(), 'YYYY') || '-' || UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 6)),
  user_id           UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  first_name        TEXT NOT NULL,
  last_name         TEXT NOT NULL,
  email             TEXT NOT NULL,
  phone             TEXT NOT NULL,
  organization_name TEXT NOT NULL,
  organization_type TEXT NOT NULL,
  purpose           TEXT NOT NULL,
  expected_voters   TEXT NOT NULL,
  status            creator_request_status NOT NULL DEFAULT 'pending',
  reviewed_by       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  rejection_reason  TEXT,
  submitted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at       TIMESTAMPTZ
);

-- ============================================================
-- ELECTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.elections (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id            UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  title                 TEXT NOT NULL,
  description           TEXT,
  organization          TEXT NOT NULL,
  status                election_status NOT NULL DEFAULT 'draft',
  starts_at             TIMESTAMPTZ,
  ends_at               TIMESTAMPTZ,
  registration_deadline TIMESTAMPTZ,
  max_voters            INTEGER NOT NULL DEFAULT 100,
  registered_count      INTEGER NOT NULL DEFAULT 0,
  waitlist_count        INTEGER NOT NULL DEFAULT 0,
  votes_cast            INTEGER NOT NULL DEFAULT 0,
  is_public             BOOLEAN NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CANDIDATES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.candidates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  election_id UUID NOT NULL REFERENCES public.elections(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  photo_url   TEXT,
  manifesto   TEXT,
  vote_count  INTEGER NOT NULL DEFAULT 0,
  position    INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- REGISTRATIONS TABLE
-- Links voters to elections; stores their secret poll ID
-- ============================================================
CREATE TABLE IF NOT EXISTS public.registrations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  election_id     UUID NOT NULL REFERENCES public.elections(id) ON DELETE CASCADE,
  voter_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status          registration_status NOT NULL DEFAULT 'registered',
  secret_poll_id  TEXT UNIQUE,                    -- POLL-XXXX, generated on finalization
  has_voted       BOOLEAN NOT NULL DEFAULT FALSE,
  registered_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  admitted_at     TIMESTAMPTZ,
  UNIQUE(election_id, voter_id)
);

-- ============================================================
-- VOTES TABLE
-- Strictly anonymous — no voter_id stored here
-- Duplicate prevention via registration.has_voted flag
-- ============================================================
CREATE TABLE IF NOT EXISTS public.votes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  election_id     UUID NOT NULL REFERENCES public.elections(id) ON DELETE CASCADE,
  candidate_id    UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  -- No voter_id — anonymity is enforced at the DB level
  -- Duplicate prevention is handled by the cast_vote RPC
  -- which atomically checks and sets registrations.has_voted
  cast_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- AUDIT LOGS TABLE
-- Immutable record of all significant actions
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  election_id UUID REFERENCES public.elections(id) ON DELETE SET NULL,
  actor_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action      audit_action NOT NULL,
  details     JSONB NOT NULL DEFAULT '{}',
  ip_address  INET,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_elections_status       ON public.elections(status);
CREATE INDEX IF NOT EXISTS idx_elections_creator      ON public.elections(creator_id);
CREATE INDEX IF NOT EXISTS idx_elections_starts_at    ON public.elections(starts_at);
CREATE INDEX IF NOT EXISTS idx_elections_ends_at      ON public.elections(ends_at);
CREATE INDEX IF NOT EXISTS idx_candidates_election    ON public.candidates(election_id);
CREATE INDEX IF NOT EXISTS idx_registrations_election ON public.registrations(election_id);
CREATE INDEX IF NOT EXISTS idx_registrations_voter    ON public.registrations(voter_id);
CREATE INDEX IF NOT EXISTS idx_registrations_secret   ON public.registrations(secret_poll_id);
CREATE INDEX IF NOT EXISTS idx_votes_election         ON public.votes(election_id);
CREATE INDEX IF NOT EXISTS idx_votes_candidate        ON public.votes(candidate_id);
CREATE INDEX IF NOT EXISTS idx_audit_election         ON public.audit_logs(election_id);
CREATE INDEX IF NOT EXISTS idx_audit_actor            ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_action           ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_creator_requests_email ON public.creator_requests(email);
CREATE INDEX IF NOT EXISTS idx_creator_requests_status ON public.creator_requests(status);
