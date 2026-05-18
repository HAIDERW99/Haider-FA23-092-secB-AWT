-- ============================================================
-- register_for_election RPC
-- Registers the authenticated voter and assigns a POLL-XXXX ID
-- Run in Supabase Dashboard > SQL Editor
-- ============================================================

CREATE OR REPLACE FUNCTION public.register_for_election(p_election_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_voter_id     UUID;
  v_election     RECORD;
  v_registration RECORD;
  v_secret_id    TEXT;
BEGIN
  v_voter_id := auth.uid();
  IF v_voter_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  SELECT id, status, max_voters, registered_count, ends_at
  INTO v_election
  FROM public.elections
  WHERE id = p_election_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'election_not_found');
  END IF;

  IF v_election.status NOT IN ('active', 'locked', 'draft') THEN
    RETURN jsonb_build_object('success', false, 'error', 'election_not_open');
  END IF;

  IF v_election.ends_at IS NOT NULL AND v_election.ends_at < NOW() THEN
    RETURN jsonb_build_object('success', false, 'error', 'election_ended');
  END IF;

  SELECT id, secret_poll_id, status, has_voted
  INTO v_registration
  FROM public.registrations
  WHERE election_id = p_election_id AND voter_id = v_voter_id;

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
  VALUES (p_election_id, v_voter_id, 'registered', v_secret_id);

  INSERT INTO public.audit_logs (election_id, actor_id, action, details)
  VALUES (
    p_election_id,
    v_voter_id,
    'voter_registered',
    jsonb_build_object('secret_id_generated', true)
  );

  RETURN jsonb_build_object('success', true, 'secret_poll_id', v_secret_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', 'server_error', 'detail', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_for_election(UUID) TO authenticated;
