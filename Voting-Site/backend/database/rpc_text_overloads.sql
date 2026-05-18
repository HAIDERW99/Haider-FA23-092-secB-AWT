-- ============================================================
-- TEXT-argument RPC overloads (PostgREST / JS string params)
-- Run in Supabase Dashboard > SQL Editor
--
-- Do NOT use ALTER FUNCTION ... (UUID, TEXT) — that signature may not
-- exist. Use CREATE OR REPLACE with (TEXT, TEXT) / (TEXT, TEXT, TEXT).
-- ============================================================

-- Optional: remove old UUID overloads if you no longer need them
-- DROP FUNCTION IF EXISTS public.verify_secret_id_v2(UUID, TEXT);
-- DROP FUNCTION IF EXISTS public.cast_vote(UUID, UUID, TEXT);

-- ── verify_secret_id_v2(TEXT, TEXT) ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.verify_secret_id_v2(
  p_election_id TEXT,
  p_secret_id   TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_election_id UUID;
  v_registration RECORD;
  v_election     RECORD;
  v_normalized   TEXT;
BEGIN
  v_normalized := UPPER(TRIM(p_secret_id));

  IF v_normalized = '' OR v_normalized IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'empty_id');
  END IF;

  BEGIN
    v_election_id := NULLIF(TRIM(p_election_id), '')::UUID;
  EXCEPTION
    WHEN invalid_text_representation THEN
      RETURN jsonb_build_object('valid', false, 'reason', 'election_not_found');
  END;

  IF v_election_id IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'election_not_found');
  END IF;

  SELECT id, status, ends_at
  INTO v_election
  FROM public.elections
  WHERE id = v_election_id;

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

  IF v_election.ends_at IS NOT NULL AND v_election.ends_at < NOW() THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'election_ended');
  END IF;

  SELECT r.id, r.voter_id, r.has_voted, r.status
  INTO v_registration
  FROM public.registrations r
  WHERE r.election_id = v_election_id
    AND UPPER(TRIM(r.secret_poll_id)) = v_normalized;

  IF NOT FOUND THEN
    INSERT INTO public.audit_logs (election_id, action, details)
    VALUES (
      v_election_id,
      'secret_id_verified',
      jsonb_build_object(
        'success', false,
        'reason', 'invalid_id',
        'input_length', LENGTH(v_normalized)
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
    v_election_id,
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

-- ── cast_vote(TEXT, TEXT, TEXT) ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.cast_vote(
  p_election_id  TEXT,
  p_candidate_id TEXT,
  p_secret_id    TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_election_id  UUID;
  v_candidate_id UUID;
  v_registration RECORD;
  v_election     RECORD;
  v_normalized   TEXT;
BEGIN
  v_normalized := UPPER(TRIM(p_secret_id));

  IF v_normalized = '' OR v_normalized IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Empty Secret ID');
  END IF;

  BEGIN
    v_election_id := NULLIF(TRIM(p_election_id), '')::UUID;
    v_candidate_id := NULLIF(TRIM(p_candidate_id), '')::UUID;
  EXCEPTION
    WHEN invalid_text_representation THEN
      RETURN jsonb_build_object('success', false, 'error', 'Invalid election or candidate');
  END;

  IF v_election_id IS NULL OR v_candidate_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid election or candidate');
  END IF;

  SELECT id, status, ends_at
  INTO v_election
  FROM public.elections
  WHERE id = v_election_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Election not found');
  END IF;

  IF v_election.status NOT IN ('active', 'locked', 'draft') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Election is not accepting votes');
  END IF;

  IF v_election.ends_at IS NOT NULL AND v_election.ends_at < NOW() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Voting period has ended');
  END IF;

  SELECT r.id, r.voter_id, r.has_voted, r.status
  INTO v_registration
  FROM public.registrations r
  WHERE r.election_id = v_election_id
    AND UPPER(TRIM(r.secret_poll_id)) = v_normalized
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.audit_logs (election_id, action, details)
    VALUES (
      v_election_id,
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
    SELECT 1 FROM public.candidates
    WHERE id = v_candidate_id AND election_id = v_election_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid candidate');
  END IF;

  INSERT INTO public.votes (election_id, candidate_id)
  VALUES (v_election_id, v_candidate_id);

  UPDATE public.candidates
  SET vote_count = vote_count + 1
  WHERE id = v_candidate_id;

  UPDATE public.elections
  SET votes_cast = votes_cast + 1
  WHERE id = v_election_id;

  UPDATE public.registrations
  SET has_voted = TRUE
  WHERE id = v_registration.id;

  INSERT INTO public.audit_logs (election_id, action, details)
  VALUES (
    v_election_id,
    'vote_cast',
    jsonb_build_object('candidate_id', v_candidate_id, 'anonymous', true)
  );

  RETURN jsonb_build_object('success', true, 'message', 'Vote cast successfully');

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', 'An unexpected error occurred: ' || SQLERRM);
END;
$$;

-- PostgREST exposes functions by argument types — grant the TEXT overloads
GRANT EXECUTE ON FUNCTION public.verify_secret_id_v2(TEXT, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.cast_vote(TEXT, TEXT, TEXT) TO authenticated, anon;

-- Reload API schema cache (Supabase often picks this up automatically)
NOTIFY pgrst, 'reload schema';
