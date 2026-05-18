-- ============================================================
-- Fix: operator does not exist: uuid = text
--
-- PostgREST / Supabase RPC calls send JSON string values. If the
-- deployed function signature or an old overload does not match,
-- PostgreSQL can compare uuid columns to text without an implicit
-- cast and raise:
--   ERROR: operator does not exist: uuid = text
--
-- Run this entire script once in:
--   Supabase Dashboard → SQL Editor → New query → Run
--
-- What it does:
--   1. Drops old verify_secret_id_v2 / cast_vote / register_for_election overloads
--   2. Recreates them with TEXT parameters for UUID fields
--   3. Casts to UUID inside the function body before every comparison
--   4. Re-grants execute to authenticated
--   5. Reloads the PostgREST schema cache
-- ============================================================

-- ── 1. Remove prior signatures (uuid and text variants) ───────────────────
DROP FUNCTION IF EXISTS public.verify_secret_id_v2(uuid, text);
DROP FUNCTION IF EXISTS public.verify_secret_id_v2(text, text);

DROP FUNCTION IF EXISTS public.cast_vote(uuid, uuid, text);
DROP FUNCTION IF EXISTS public.cast_vote(text, text, text);

DROP FUNCTION IF EXISTS public.register_for_election(uuid);
DROP FUNCTION IF EXISTS public.register_for_election(text);

-- Legacy v1 (optional — remove if you still have it and want only v2)
DROP FUNCTION IF EXISTS public.verify_secret_id(uuid, text);
DROP FUNCTION IF EXISTS public.verify_secret_id(text, text);

-- ── 2. verify_secret_id_v2 ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.verify_secret_id_v2(
  p_election_id text,
  p_secret_id   text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_election_uuid uuid;
  v_registration  record;
  v_election      record;
  v_normalized    text;
BEGIN
  -- Cast election id (from URL / frontend string) → uuid
  IF p_election_id IS NULL OR btrim(p_election_id) = '' THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'invalid_election_id');
  END IF;

  BEGIN
    v_election_uuid := btrim(p_election_id)::uuid;
  EXCEPTION
    WHEN invalid_text_representation THEN
      RETURN jsonb_build_object('valid', false, 'reason', 'invalid_election_id');
  END;

  v_normalized := upper(btrim(coalesce(p_secret_id, '')));

  IF v_normalized = '' THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'empty_id');
  END IF;

  SELECT e.id, e.status, e.ends_at
  INTO v_election
  FROM public.elections e
  WHERE e.id = v_election_uuid;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'election_not_found');
  END IF;

  IF v_election.status NOT IN ('active', 'locked', 'draft') THEN
    RETURN jsonb_build_object(
      'valid', false,
      'reason', 'election_not_active',
      'status', v_election.status
    );
  END IF;

  IF v_election.ends_at IS NOT NULL AND v_election.ends_at < now() THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'election_ended');
  END IF;

  SELECT r.id, r.voter_id, r.has_voted, r.status
  INTO v_registration
  FROM public.registrations r
  WHERE r.election_id = v_election_uuid
    AND upper(btrim(r.secret_poll_id)) = v_normalized;

  IF NOT FOUND THEN
    INSERT INTO public.audit_logs (election_id, action, details)
    VALUES (
      v_election_uuid,
      'secret_id_verified',
      jsonb_build_object(
        'success', false,
        'reason', 'invalid_id',
        'input_length', length(v_normalized)
      )
    );
    RETURN jsonb_build_object('valid', false, 'reason', 'invalid_id');
  END IF;

  IF v_registration.has_voted THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'already_voted');
  END IF;

  IF v_registration.status NOT IN ('registered', 'admitted') THEN
    RETURN jsonb_build_object(
      'valid', false,
      'reason', 'not_eligible',
      'registration_status', v_registration.status
    );
  END IF;

  INSERT INTO public.audit_logs (election_id, action, details)
  VALUES (
    v_election_uuid,
    'secret_id_verified',
    jsonb_build_object('success', true, 'voter_id', v_registration.voter_id)
  );

  RETURN jsonb_build_object('valid', true);

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'valid', false,
      'reason', 'server_error',
      'detail', SQLERRM
    );
END;
$$;

-- ── 3. cast_vote (same TEXT → UUID casting) ───────────────────────────────
CREATE OR REPLACE FUNCTION public.cast_vote(
  p_election_id  text,
  p_candidate_id text,
  p_secret_id    text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_election_uuid   uuid;
  v_candidate_uuid  uuid;
  v_registration    record;
  v_election        record;
  v_normalized      text;
BEGIN
  IF p_election_id IS NULL OR btrim(p_election_id) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid election ID');
  END IF;

  IF p_candidate_id IS NULL OR btrim(p_candidate_id) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid candidate ID');
  END IF;

  BEGIN
    v_election_uuid := btrim(p_election_id)::uuid;
    v_candidate_uuid := btrim(p_candidate_id)::uuid;
  EXCEPTION
    WHEN invalid_text_representation THEN
      RETURN jsonb_build_object('success', false, 'error', 'Invalid election or candidate ID');
  END;

  v_normalized := upper(btrim(coalesce(p_secret_id, '')));

  IF v_normalized = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Empty Secret ID');
  END IF;

  SELECT e.id, e.status, e.ends_at
  INTO v_election
  FROM public.elections e
  WHERE e.id = v_election_uuid;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Election not found');
  END IF;

  IF v_election.status NOT IN ('active', 'locked', 'draft') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Election is not accepting votes');
  END IF;

  IF v_election.ends_at IS NOT NULL AND v_election.ends_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Voting period has ended');
  END IF;

  SELECT r.id, r.voter_id, r.has_voted, r.status
  INTO v_registration
  FROM public.registrations r
  WHERE r.election_id = v_election_uuid
    AND upper(btrim(r.secret_poll_id)) = v_normalized
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.audit_logs (election_id, action, details)
    VALUES (
      v_election_uuid,
      'secret_id_verified',
      jsonb_build_object('success', false, 'reason', 'invalid_secret_id')
    );
    RETURN jsonb_build_object('success', false, 'error', 'Invalid Secret ID');
  END IF;

  IF v_registration.status NOT IN ('registered', 'admitted') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Voter is not eligible');
  END IF;

  IF v_registration.has_voted THEN
    RETURN jsonb_build_object('success', false, 'error', 'You have already voted in this election');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.candidates c
    WHERE c.id = v_candidate_uuid
      AND c.election_id = v_election_uuid
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid candidate');
  END IF;

  INSERT INTO public.votes (election_id, candidate_id)
  VALUES (v_election_uuid, v_candidate_uuid);

  UPDATE public.candidates
  SET vote_count = vote_count + 1
  WHERE id = v_candidate_uuid;

  UPDATE public.elections
  SET votes_cast = votes_cast + 1
  WHERE id = v_election_uuid;

  UPDATE public.registrations
  SET has_voted = true
  WHERE id = v_registration.id;

  INSERT INTO public.audit_logs (election_id, action, details)
  VALUES (
    v_election_uuid,
    'vote_cast',
    jsonb_build_object('candidate_id', v_candidate_uuid, 'anonymous', true)
  );

  RETURN jsonb_build_object('success', true, 'message', 'Vote cast successfully');

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', 'An unexpected error occurred: ' || SQLERRM);
END;
$$;

-- ── 4. register_for_election (TEXT election id) ───────────────────────────
CREATE OR REPLACE FUNCTION public.register_for_election(p_election_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_election_uuid  uuid;
  v_voter_id       uuid;
  v_election       record;
  v_registration   record;
  v_secret_id      text;
BEGIN
  v_voter_id := auth.uid();
  IF v_voter_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  IF p_election_id IS NULL OR btrim(p_election_id) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_election_id');
  END IF;

  BEGIN
    v_election_uuid := btrim(p_election_id)::uuid;
  EXCEPTION
    WHEN invalid_text_representation THEN
      RETURN jsonb_build_object('success', false, 'error', 'invalid_election_id');
  END;

  SELECT e.id, e.status, e.max_voters, e.registered_count, e.ends_at
  INTO v_election
  FROM public.elections e
  WHERE e.id = v_election_uuid;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'election_not_found');
  END IF;

  IF v_election.status NOT IN ('active', 'locked', 'draft') THEN
    RETURN jsonb_build_object('success', false, 'error', 'election_not_open');
  END IF;

  IF v_election.ends_at IS NOT NULL AND v_election.ends_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'election_ended');
  END IF;

  SELECT r.id, r.secret_poll_id, r.status, r.has_voted
  INTO v_registration
  FROM public.registrations r
  WHERE r.election_id = v_election_uuid
    AND r.voter_id = v_voter_id;

  IF FOUND THEN
    IF v_registration.has_voted THEN
      RETURN jsonb_build_object('success', false, 'error', 'already_voted');
    END IF;

    IF v_registration.secret_poll_id IS NULL THEN
      v_secret_id := public.generate_secret_poll_id();
      UPDATE public.registrations
      SET secret_poll_id = v_secret_id
      WHERE id = v_registration.id;
    ELSE
      v_secret_id := v_registration.secret_poll_id;
    END IF;

    RETURN jsonb_build_object(
      'success', true,
      'secret_poll_id', v_secret_id,
      'already_registered', true
    );
  END IF;

  IF v_election.registered_count >= v_election.max_voters THEN
    RETURN jsonb_build_object('success', false, 'error', 'election_full');
  END IF;

  v_secret_id := public.generate_secret_poll_id();

  INSERT INTO public.registrations (election_id, voter_id, status, secret_poll_id)
  VALUES (v_election_uuid, v_voter_id, 'registered', v_secret_id);

  INSERT INTO public.audit_logs (election_id, actor_id, action, details)
  VALUES (
    v_election_uuid,
    v_voter_id,
    'voter_registered',
    jsonb_build_object('secret_id_generated', true)
  );

  RETURN jsonb_build_object('success', true, 'secret_poll_id', v_secret_id);

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', 'server_error', 'detail', SQLERRM);
END;
$$;

-- ── 5. Grants (authenticated callers via Supabase anon + JWT) ─────────────
GRANT EXECUTE ON FUNCTION public.verify_secret_id_v2(text, text) TO authenticated;

GRANT EXECUTE ON FUNCTION public.cast_vote(text, text, text) TO authenticated;

GRANT EXECUTE ON FUNCTION public.register_for_election(text) TO authenticated;

-- ── 6. Refresh PostgREST API schema (Supabase) ────────────────────────────
NOTIFY pgrst, 'reload schema';

-- ── 7. Quick smoke test (optional — replace with a real election UUID) ──────
-- SELECT public.verify_secret_id_v2(
--   'f7f41ea1-c55e-4772-b375-ea37e0325fae',
--   'POLL-XXXXXXXX'
-- );
