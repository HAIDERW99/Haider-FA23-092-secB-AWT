-- ============================================================
-- Row Level Security Policies
-- Run AFTER schema.sql
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_requests  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elections         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs        ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Helper function: get current user role
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS user_role
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- ============================================================
-- PROFILES policies
-- ============================================================
-- Users can read their own profile
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

-- Super admins can read all profiles
CREATE POLICY "profiles_select_admin"
  ON public.profiles FOR SELECT
  USING (public.get_my_role() = 'super_admin');

-- Users can update their own profile (not role)
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

-- Super admins can update any profile (including role)
CREATE POLICY "profiles_update_admin"
  ON public.profiles FOR UPDATE
  USING (public.get_my_role() = 'super_admin');

-- Profiles are created via trigger (no direct insert by users)
CREATE POLICY "profiles_insert_service"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- ============================================================
-- CREATOR REQUESTS policies
-- ============================================================
-- Anyone authenticated can submit a request
CREATE POLICY "creator_requests_insert"
  ON public.creator_requests FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Users can view their own requests
CREATE POLICY "creator_requests_select_own"
  ON public.creator_requests FOR SELECT
  USING (email = (SELECT email FROM public.profiles WHERE id = auth.uid()));

-- Super admins can view all requests
CREATE POLICY "creator_requests_select_admin"
  ON public.creator_requests FOR SELECT
  USING (public.get_my_role() = 'super_admin');

-- Only super admins can update (approve/reject)
CREATE POLICY "creator_requests_update_admin"
  ON public.creator_requests FOR UPDATE
  USING (public.get_my_role() = 'super_admin');

-- ============================================================
-- ELECTIONS policies
-- ============================================================
-- Public elections are readable by everyone (including anon)
CREATE POLICY "elections_select_public"
  ON public.elections FOR SELECT
  USING (is_public = TRUE AND status != 'draft');

-- Creators can see their own drafts
CREATE POLICY "elections_select_own_draft"
  ON public.elections FOR SELECT
  USING (creator_id = auth.uid());

-- Super admins can see all elections
CREATE POLICY "elections_select_admin"
  ON public.elections FOR SELECT
  USING (public.get_my_role() = 'super_admin');

-- Election creators can create elections
CREATE POLICY "elections_insert_creator"
  ON public.elections FOR INSERT
  WITH CHECK (
    creator_id = auth.uid() AND
    public.get_my_role() IN ('election_creator', 'super_admin')
  );

-- Creators can update their own elections (not completed/cancelled)
CREATE POLICY "elections_update_own"
  ON public.elections FOR UPDATE
  USING (
    creator_id = auth.uid() AND
    status NOT IN ('completed', 'cancelled')
  );

-- Super admins can update any election
CREATE POLICY "elections_update_admin"
  ON public.elections FOR UPDATE
  USING (public.get_my_role() = 'super_admin');

-- ============================================================
-- CANDIDATES policies
-- ============================================================
-- Anyone can read candidates for public elections
CREATE POLICY "candidates_select_public"
  ON public.candidates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.elections e
      WHERE e.id = election_id AND (e.is_public = TRUE OR e.creator_id = auth.uid())
    )
  );

-- Creators can manage candidates for their elections
CREATE POLICY "candidates_insert_creator"
  ON public.candidates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.elections e
      WHERE e.id = election_id AND e.creator_id = auth.uid() AND e.status = 'draft'
    )
  );

CREATE POLICY "candidates_update_creator"
  ON public.candidates FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.elections e
      WHERE e.id = election_id AND e.creator_id = auth.uid() AND e.status = 'draft'
    )
  );

CREATE POLICY "candidates_delete_creator"
  ON public.candidates FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.elections e
      WHERE e.id = election_id AND e.creator_id = auth.uid() AND e.status = 'draft'
    )
  );

-- ============================================================
-- REGISTRATIONS policies
-- Voters can only see their OWN registrations
-- ============================================================
CREATE POLICY "registrations_select_own"
  ON public.registrations FOR SELECT
  USING (voter_id = auth.uid());

-- Election creators can see registrations for their elections
CREATE POLICY "registrations_select_creator"
  ON public.registrations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.elections e
      WHERE e.id = election_id AND e.creator_id = auth.uid()
    )
  );

-- Super admins can see all registrations
CREATE POLICY "registrations_select_admin"
  ON public.registrations FOR SELECT
  USING (public.get_my_role() = 'super_admin');

-- Authenticated voters can register for active elections
CREATE POLICY "registrations_insert_voter"
  ON public.registrations FOR INSERT
  WITH CHECK (
    voter_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.elections e
      WHERE e.id = election_id AND e.status = 'active'
    )
  );

-- Only service role / RPC functions update registrations
CREATE POLICY "registrations_update_service"
  ON public.registrations FOR UPDATE
  USING (
    voter_id = auth.uid() OR
    public.get_my_role() IN ('election_creator', 'super_admin')
  );

-- ============================================================
-- VOTES policies
-- Votes are anonymous — no voter can query individual votes
-- Only aggregate counts are exposed via candidates.vote_count
-- ============================================================
-- No SELECT policy for regular users — votes are write-only via RPC
-- Super admins can audit vote counts (not individual votes)
CREATE POLICY "votes_select_admin"
  ON public.votes FOR SELECT
  USING (public.get_my_role() = 'super_admin');

-- Votes are only inserted via the cast_vote RPC (SECURITY DEFINER)
-- No direct INSERT policy for users
CREATE POLICY "votes_insert_rpc_only"
  ON public.votes FOR INSERT
  WITH CHECK (FALSE); -- Blocked for direct inserts; RPC uses SECURITY DEFINER

-- ============================================================
-- AUDIT LOGS policies
-- Audit logs are append-only and readable by admins/creators
-- ============================================================
CREATE POLICY "audit_logs_select_creator"
  ON public.audit_logs FOR SELECT
  USING (
    public.get_my_role() = 'super_admin' OR
    EXISTS (
      SELECT 1 FROM public.elections e
      WHERE e.id = election_id AND e.creator_id = auth.uid()
    )
  );

-- Only service role can insert audit logs (via SECURITY DEFINER functions)
CREATE POLICY "audit_logs_insert_service"
  ON public.audit_logs FOR INSERT
  WITH CHECK (FALSE); -- All inserts go through SECURITY DEFINER functions

-- No updates or deletes on audit logs (immutable)
