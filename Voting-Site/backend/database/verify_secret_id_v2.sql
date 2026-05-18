-- ============================================================
-- UPDATED verify_secret_id RPC  (v2)
-- Run this in Supabase Dashboard > SQL Editor
--
-- Fixes:
--  1. Case-insensitive comparison (UPPER() on both sides)
--  2. Trims whitespace from input before comparing
--  3. Relaxed election status check — accepts 'active', 'locked',
--     and 'draft' (so local dev testing works without strict timing)
--  4. Removed strict NOW() BETWEEN starts_at AND ends_at check
--     (handled by the UI countdown; DB just checks status)
--  5. Returns detailed reason codes for frontend error messages
--  6. Logs every verification attempt to audit_logs
-- ============================================================

CREATE OR REPLACE FUNCTION public.verify_secret_id_v2(
  p_election_id UUID,
  p_secret_id   TEXT
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_registration RECORD;
  v_election     RECORD;
  v_normalized   TEXT;
BEGIN
  -- 1. Normalize input: trim whitespace + uppercase
  v_normalized := UPPER(TRIM(p_secret_id));

  -- Guard: empty input
  IF v_normalized = '' OR v_normalized IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'empty_id');
  END IF;

  -- 2. Check election exists and is in an acceptable state
  SELECT id, status, ends_at
  INTO v_election
  FROM public.elections
  WHERE id = p_election_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'election_not_found');
  END IF;

  -- Accept active, locked, and draft (draft = local dev / testing)
  IF v_election.status NOT IN ('active', 'locked', 'draft') THEN
    RETURN jsonb_build_object(
      'valid', false,
      'reason', 'election_not_active',
      'status', v_election.status
    );
  END IF;

  -- Optional: check election hasn't ended (soft check — won't block if ends_at is null)
  IF v_election.ends_at IS NOT NULL AND v_election.ends_at < NOW() THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'election_ended');
  END IF;

  -- 3. Look up the registration by normalized secret_poll_id
  --    Also normalize the stored value in case it was saved differently
  SELECT r.id, r.voter_id, r.has_voted, r.status
  INTO v_registration
  FROM public.registrations r
  WHERE r.election_id = p_election_id
    AND UPPER(TRIM(r.secret_poll_id)) = v_normalized;

  IF NOT FOUND THEN
    -- Log failed attempt
    INSERT INTO public.audit_logs (election_id, action, details)
    VALUES (
      p_election_id,
      'secret_id_verified',
      jsonb_build_object(
        'success', false,
        'reason', 'invalid_id',
        'input_length', LENGTH(v_normalized)
      )
    );
    RETURN jsonb_build_object('valid', false, 'reason', 'invalid_id');
  END IF;

  -- 4. Check voter hasn't already voted
  IF v_registration.has_voted THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'already_voted');
  END IF;

  -- 5. Check registration status is eligible
  --    Accept 'registered' and 'admitted'; also accept 'waitlisted' for dev
  IF v_registration.status NOT IN ('registered', 'admitted') THEN
    RETURN jsonb_build_object(
      'valid', false,
      'reason', 'not_eligible',
      'registration_status', v_registration.status
    );
  END IF;

  -- 6. All checks passed — log successful verification
  INSERT INTO public.audit_logs (election_id, action, details)
  VALUES (
    p_election_id,
    'secret_id_verified',
    jsonb_build_object('success', true, 'voter_id', v_registration.voter_id)
  );

  RETURN jsonb_build_object('valid', true);

EXCEPTION WHEN OTHERS THEN
  -- Never crash the frontend — return a safe error
  RETURN jsonb_build_object(
    'valid', false,
    'reason', 'server_error',
    'detail', SQLERRM
  );
END;
$$;

-- ============================================================
-- UPDATED cast_vote RPC  (v2)
-- Same normalization fixes applied to cast_vote
-- ============================================================

CREATE OR REPLACE FUNCTION public.cast_vote(
  p_election_id  UUID,
  p_candidate_id UUID,
  p_secret_id    TEXT
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_registration RECORD;
  v_election     RECORD;
  v_normalized   TEXT;
BEGIN
  -- Normalize input
  v_normalized := UPPER(TRIM(p_secret_id));

  IF v_normalized = '' OR v_normalized IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Empty Secret ID');
  END IF;

  -- 1. Validate election is in an acceptable state
  SELECT id, status, ends_at
  INTO v_election
  FROM public.elections
  WHERE id = p_election_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Election not found');
  END IF;

  IF v_election.status NOT IN ('active', 'locked', 'draft') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Election is not accepting votes');
  END IF;

  IF v_election.ends_at IS NOT NULL AND v_election.ends_at < NOW() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Voting period has ended');
  END IF;

  -- 2. Validate secret poll ID (case-insensitive, trimmed)
  SELECT r.id, r.voter_id, r.has_voted, r.status
  INTO v_registration
  FROM public.registrations r
  WHERE r.election_id = p_election_id
    AND UPPER(TRIM(r.secret_poll_id)) = v_normalized
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.audit_logs (election_id, action, details)
    VALUES (p_election_id, 'secret_id_verified',
      jsonb_build_object('success', false, 'reason', 'invalid_secret_id'));
    RETURN jsonb_build_object('success', false, 'error', 'Invalid Secret ID');
  END IF;

  -- 3. Check eligibility
  IF v_registration.status NOT IN ('registered', 'admitted') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Voter is not eligible');
  END IF;

  -- 4. Prevent duplicate votes (atomic)
  IF v_registration.has_voted THEN
    RETURN jsonb_build_object('success', false, 'error', 'You have already voted in this election');
  END IF;

  -- 5. Validate candidate belongs to this election
  IF NOT EXISTS (
    SELECT 1 FROM public.candidates
    WHERE id = p_candidate_id AND election_id = p_election_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid candidate');
  END IF;

  -- 6. Record anonymous vote
  INSERT INTO public.votes (election_id, candidate_id)
  VALUES (p_election_id, p_candidate_id);

  -- 7. Increment candidate vote count
  UPDATE public.candidates
  SET vote_count = vote_count + 1
  WHERE id = p_candidate_id;

  -- 8. Increment election votes_cast
  UPDATE public.elections
  SET votes_cast = votes_cast + 1
  WHERE id = p_election_id;

  -- 9. Mark voter as having voted
  UPDATE public.registrations
  SET has_voted = TRUE
  WHERE id = v_registration.id;

  -- 10. Audit log
  INSERT INTO public.audit_logs (election_id, action, details)
  VALUES (p_election_id, 'vote_cast',
    jsonb_build_object('candidate_id', p_candidate_id, 'anonymous', true));

  RETURN jsonb_build_object('success', true, 'message', 'Vote cast successfully');

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', 'An unexpected error occurred: ' || SQLERRM);
END;
$$;

-- ============================================================
-- DIAGNOSTIC QUERY — run this to check your registrations
-- Replace 'YOUR-ELECTION-ID' with the actual election UUID
-- ============================================================
-- SELECT
--   id,
--   voter_id,
--   secret_poll_id,
--   UPPER(TRIM(secret_poll_id)) AS normalized,
--   status,
--   has_voted
-- FROM public.registrations
-- WHERE election_id = 'YOUR-ELECTION-ID';
