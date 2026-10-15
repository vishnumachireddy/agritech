
-- Replace overly permissive insert policy with one restricted to service role
-- The trigger runs as SECURITY DEFINER so it bypasses RLS anyway
-- This policy is just a safety net
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- Since the trigger function is SECURITY DEFINER, it bypasses RLS entirely.
-- No INSERT policy is needed for notifications - only the trigger inserts.
