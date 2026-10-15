
-- Add latitude/longitude to profiles for consumer location
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS latitude numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS longitude numeric DEFAULT NULL;
