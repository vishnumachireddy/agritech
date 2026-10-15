
-- Add latitude and longitude to farmer_details for location tracking
ALTER TABLE public.farmer_details
  ADD COLUMN IF NOT EXISTS latitude numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS longitude numeric DEFAULT NULL;
