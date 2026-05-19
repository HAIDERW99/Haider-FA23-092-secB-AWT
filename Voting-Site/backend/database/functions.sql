-- ============================================================
-- Database Functions & Triggers
-- Run AFTER schema.sql and rls.sql
-- ============================================================

-- ============================================================
-- TRIGGER: Auto-create profile on auth.users insert
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'voter'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- TRIGGER: Update updated_at timestamps
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER elections_updated_at
  BEFORE UPDATE ON public.elections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- FUNCTION: Generate unique POLL-XXXX secret ID
-- Called when a voter is finalized (election goes active)
-- ============================================================
CREATE OR REPLACE FUNCTION public.generate_secret_poll_id()
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  new_id TEXT;
  attempts INT := 0;
BEGIN
  LOOP
    -- Generate POLL- followed by 8 random alphanumeric chars
    new_id := 'POLL-' || UPPER(
      SUBSTRING(
        REPLACE(REPLACE(encode(gen_random_bytes(6), 'base64'), '+', 'A'), '/', 'B'),
        1, 8
      )
    );
    -- Ensure uniqueness
    IF NOT EXISTS (SELECT 1 FROM public.registrations WHERE secret_poll_id = new_id) THEN
      RETURN new_id;
    END IF;
    attempts := attempts + 1;
    IF attempts > 100 THEN
      RAISE EXCEPTION 'Could not generate unique poll ID after 100 attempts';
    END IF;
  END LOOP;
END;
$$;

-- ============================================================
-- FUNCTION: Finalize voter registrations
-- Assigns secret poll IDs to all registered voters when
-- an election transitions from draft -> active
-- ============================================================
CREATE OR REPLACE FUNCTION public.finalize_voter_registrations(p_election_id UUID)
RETURNS TABLE(voter_id UUID, email TEXT, secret_poll_id TEXT)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT r.id AS reg_id, r.voter_id, p.email
    FROM public.registrations r
    JOIN public.profiles p ON p.id = r.voter_id
    WHERE r.election_id = p_election_id
      AND r.status = 'registered'
      AND r.secret_poll_id IS NULL
  LOOP
    UPDATE public.registrations
    SET secret_poll_id = public.generate_secret_poll_id()
    WHERE id = rec.reg_id
    RETURNING secret_poll_id INTO rec;

    -- Log the action
    INSERT INTO public.audit_logs (election_id, actor_id, action, details)
    VALUES (
      p_election_id,
      rec.voter_id,
      'secret_id_generated',
      jsonb_build_object('voter_id', rec.voter_id)
    );

    RETURN QUERY SELECT rec.voter_id, rec.email, rec.secret_poll_id;
  END LOOP;
END;
$$;

-- ============================================================
-- FUNCTION: Lock election when max_voters reached
-- Called by trigger on registrations insert
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_election_capacity()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_election RECORD;
BEGIN
  SELECT id, max_voters, registered_count, status
  INTO v_election
  FROM public.elections
  WHERE id = NEW.election_id
  FOR UPDATE;

  IF NEW.status = 'registered' THEN
    -- Increment registered count
    UPDATE public.elections
    SET registered_count = registered_count + 1
    WHERE id = NEW.election_id;

    -- Lock if at capacity
    IF v_election.registered_count + 1 >= v_election.max_voters
       AND v_election.status = 'active' THEN
      UPDATE public.elections
      SET status = 'locked'
      WHERE id = NEW.election_id;

      INSERT INTO public.audit_logs (election_id, action, details)
      VALUES (
        NEW.election_id,
        'election_locked',
        jsonb_build_object('reason', 'max_voters_reached', 'count', v_election.max_voters)
      );
    END IF;

  ELSIF NEW.status = 'waitlisted' THEN
    UPDATE public.elections
    SET waitlist_count = waitlist_count + 1
    WHERE id = NEW.election_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_registration_insert
  AFTER INSERT ON public.registrations
  FOR EACH ROW EXECUTE FUNCTION public.check_election_capacity();

-- ============================================================
-- FUNCTION: cast_vote RPC
-- Validates secret ID, prevents duplicates, records anonymous vote
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
BEGIN
  -- 1. Validate election is active
  SELECT id, status, ends_at
  INTO v_election
  FROM public.elections
  WHERE id = p_election_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Election not found');
  END IF;

  IF v_election.status NOT IN ('active', 'locked') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Election is not accepting votes');
  END IF;

  IF v_election.ends_at IS NOT NULL AND v_election.ends_at < NOW() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Voting period has ended');
  END IF;

  -- 2. Validate secret poll ID against this election
  SELECT r.id, r.voter_id, r.has_voted, r.status
  INTO v_registration
  FROM public.registrations r
  WHERE r.election_id = p_election_id
    AND r.secret_poll_id = p_secret_id
  FOR UPDATE;  -- Lock row to prevent race conditions

  IF NOT FOUND THEN
    -- Log failed attempt (no voter_id since we don't know who it is)
    INSERT INTO public.audit_logs (election_id, action, details)
    VALUES (
      p_election_id,
      'secret_id_verified',
      jsonb_build_object('success', false, 'reason', 'invalid_secret_id')
    );
    RETURN jsonb_build_object('success', false, 'error', 'Invalid Secret ID');
  END IF;

  -- 3. Check registration status
  IF v_registration.status NOT IN ('registered', 'admitted') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Voter is not eligible');
  END IF;

  -- 4. Prevent duplicate votes (atomic check)
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

  -- 6. Record the anonymous vote
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

  -- 9. Mark voter as having voted (prevents duplicates)
  UPDATE public.registrations
  SET has_voted = TRUE
  WHERE id = v_registration.id;

  -- 10. Audit log
  INSERT INTO public.audit_logs (election_id, action, details)
  VALUES (
    p_election_id,
    'vote_cast',
    jsonb_build_object('candidate_id', p_candidate_id, 'anonymous', true)
  );

  RETURN jsonb_build_object('success', true, 'message', 'Vote cast successfully');

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', 'An unexpected error occurred');
END;
$$;

-- ============================================================
-- FUNCTION: verify_secret_id RPC
-- Validates a secret ID without casting a vote
-- Returns whether the ID is valid and voter hasn't voted yet
-- ============================================================
CREATE OR REPLACE FUNCTION public.verify_secret_id(
  p_election_id UUID,
  p_secret_id   TEXT
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_registration RECORD;
BEGIN
  SELECT r.has_voted, r.status
  INTO v_registration
  FROM public.registrations r
  WHERE r.election_id = p_election_id
    AND r.secret_poll_id = p_secret_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'invalid_id');
  END IF;

  IF v_registration.has_voted THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'already_voted');
  END IF;

  IF v_registration.status NOT IN ('registered', 'admitted') THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'not_eligible');
  END IF;

  -- Log successful verification
  INSERT INTO public.audit_logs (election_id, action, details)
  VALUES (
    p_election_id,
    'secret_id_verified',
    jsonb_build_object('success', true)
  );

  RETURN jsonb_build_object('valid', true);
END;
$$;

-- ============================================================
-- FUNCTION: admin_override_max_voters
-- Allows super admin or creator to increase max voters
-- Automatically admits waitlisted voters if capacity opens
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_override_max_voters(
  p_election_id UUID,
  p_new_max     INTEGER,
  p_reason      TEXT,
  p_actor_id    UUID
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_election    RECORD;
  v_old_max     INTEGER;
  v_admitted    INTEGER := 0;
  v_slots       INTEGER;
BEGIN
  SELECT id, max_voters, registered_count, waitlist_count, status
  INTO v_election
  FROM public.elections
  WHERE id = p_election_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Election not found');
  END IF;

  v_old_max := v_election.max_voters;

  -- Update max voters
  UPDATE public.elections
  SET max_voters = p_new_max,
      status = CASE
        WHEN status = 'locked' AND p_new_max > registered_count THEN 'active'
        ELSE status
      END
  WHERE id = p_election_id;

  -- Admit waitlisted voters if new capacity allows
  v_slots := p_new_max - v_election.registered_count;
  IF v_slots > 0 AND v_election.waitlist_count > 0 THEN
    WITH admitted_voters AS (
      UPDATE public.registrations
      SET status = 'admitted', admitted_at = NOW()
      WHERE election_id = p_election_id
        AND status = 'waitlisted'
        AND id IN (
          SELECT id FROM public.registrations
          WHERE election_id = p_election_id AND status = 'waitlisted'
          ORDER BY registered_at ASC
          LIMIT v_slots
        )
      RETURNING id
    )
    SELECT COUNT(*) INTO v_admitted FROM admitted_voters;

    -- Update counts
    UPDATE public.elections
    SET registered_count = registered_count + v_admitted,
        waitlist_count = waitlist_count - v_admitted
    WHERE id = p_election_id;
  END IF;

  -- Audit log
  INSERT INTO public.audit_logs (election_id, actor_id, action, details)
  VALUES (
    p_election_id,
    p_actor_id,
    'admin_override',
    jsonb_build_object(
      'field', 'max_voters',
      'before', v_old_max,
      'after', p_new_max,
      'reason', p_reason,
      'voters_admitted_from_waitlist', v_admitted
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'old_max', v_old_max,
    'new_max', p_new_max,
    'voters_admitted', v_admitted
  );
END;
$$;

-- ============================================================
-- FUNCTION: lock_expired_elections
-- Called by a scheduled job (pg_cron or Edge Function cron)
-- Locks elections past their end date or registration deadline
-- ============================================================
CREATE OR REPLACE FUNCTION public.lock_expired_elections()
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  -- End elections past their end date
  WITH ended AS (
    UPDATE public.elections
    SET status = 'completed'
    WHERE status IN ('active', 'locked')
      AND ends_at IS NOT NULL
      AND ends_at < NOW()
    RETURNING id
  )
  SELECT COUNT(*) INTO v_count FROM ended;

  -- Insert audit logs for ended elections
  INSERT INTO public.audit_logs (election_id, action, details)
  SELECT id, 'election_ended', jsonb_build_object('reason', 'deadline_passed')
  FROM public.elections
  WHERE status = 'completed'
    AND ends_at IS NOT NULL
    AND ends_at < NOW()
    AND ends_at > NOW() - INTERVAL '5 minutes'; -- Only recently ended

  RETURN v_count;
END;
$$;

-- ============================================================
-- FUNCTION: approve_creator_request
-- Promotes user to election_creator role
-- ============================================================
CREATE OR REPLACE FUNCTION public.approve_creator_request(
  p_request_id UUID,
  p_admin_id   UUID
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request RECORD;
BEGIN
  SELECT id, email, user_id, status
  INTO v_request
  FROM public.creator_requests
  WHERE id = p_request_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request not found');
  END IF;

  IF v_request.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request already processed');
  END IF;

  -- Update request status
  UPDATE public.creator_requests
  SET status = 'approved',
      reviewed_by = p_admin_id,
      reviewed_at = NOW()
  WHERE id = p_request_id;

  -- Promote user role if they have an account
  IF v_request.user_id IS NOT NULL THEN
    UPDATE public.profiles
    SET role = 'election_creator'
    WHERE id = v_request.user_id;
  END IF;

  -- Audit log
  INSERT INTO public.audit_logs (actor_id, action, details)
  VALUES (
    p_admin_id,
    'creator_approved',
    jsonb_build_object('request_id', p_request_id, 'email', v_request.email)
  );

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ============================================================
-- FUNCTION: reject_creator_request
-- ============================================================
CREATE OR REPLACE FUNCTION public.reject_creator_request(
  p_request_id UUID,
  p_admin_id   UUID,
  p_reason     TEXT
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request RECORD;
BEGIN
  SELECT id, email, status
  INTO v_request
  FROM public.creator_requests
  WHERE id = p_request_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request not found');
  END IF;

  IF v_request.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request already processed');
  END IF;

  UPDATE public.creator_requests
  SET status = 'rejected',
      reviewed_by = p_admin_id,
      reviewed_at = NOW(),
      rejection_reason = p_reason
  WHERE id = p_request_id;

  INSERT INTO public.audit_logs (actor_id, action, details)
  VALUES (
    p_admin_id,
    'creator_rejected',
    jsonb_build_object('request_id', p_request_id, 'email', v_request.email, 'reason', p_reason)
  );

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ============================================================
-- REALTIME: Enable realtime on key tables
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.elections;
ALTER PUBLICATION supabase_realtime ADD TABLE public.candidates;
ALTER PUBLICATION supabase_realtime ADD TABLE public.registrations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.creator_requests;

GRANT EXECUTE ON FUNCTION public.approve_creator_request(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_creator_request(UUID, UUID, TEXT) TO authenticated;
