-- Fix: admin cannot see creator requests + realtime updates
-- Run in Supabase SQL Editor after schema.sql / rls.sql / functions.sql

-- Allow unauthenticated users to submit creator requests (matches /creator-request UI)
DROP POLICY IF EXISTS "creator_requests_insert_anon" ON public.creator_requests;
CREATE POLICY "creator_requests_insert_anon"
  ON public.creator_requests FOR INSERT
  TO anon
  WITH CHECK (true);

-- Let signed-in applicants read requests tied to their account
DROP POLICY IF EXISTS "creator_requests_select_own_user" ON public.creator_requests;
CREATE POLICY "creator_requests_select_own_user"
  ON public.creator_requests FOR SELECT
  USING (user_id = auth.uid());

-- Enable realtime for new creator request notifications on admin dashboard
ALTER PUBLICATION supabase_realtime ADD TABLE public.creator_requests;

-- Ensure admin RPCs are callable by authenticated super admins
GRANT EXECUTE ON FUNCTION public.approve_creator_request(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_creator_request(UUID, UUID, TEXT) TO authenticated;
