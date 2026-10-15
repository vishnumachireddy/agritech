
-- Add phone column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text NOT NULL DEFAULT '';

-- Create farmer_details table
CREATE TABLE public.farmer_details (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  primary_crop text NOT NULL DEFAULT '',
  secondary_crop text DEFAULT '',
  land_area numeric NOT NULL DEFAULT 0,
  total_yield numeric NOT NULL DEFAULT 0,
  monthly_production numeric NOT NULL DEFAULT 0,
  expected_price numeric NOT NULL DEFAULT 0,
  water_availability text NOT NULL DEFAULT 'Medium',
  farming_type text NOT NULL DEFAULT 'Mixed',
  harvest_cycle text NOT NULL DEFAULT 'Seasonal',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.farmer_details ENABLE ROW LEVEL SECURITY;

-- Farmers can view and update their own details
CREATE POLICY "Farmers can view own details"
  ON public.farmer_details FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Farmers can insert own details"
  ON public.farmer_details FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Farmers can update own details"
  ON public.farmer_details FOR UPDATE
  USING (auth.uid() = user_id);

-- Consumers can view all farmer details (for marketplace/farmers page)
CREATE POLICY "Consumers can view all farmer details"
  ON public.farmer_details FOR SELECT
  USING (true);

-- Update handle_new_user to include phone
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'farmer')
  );
  RETURN NEW;
END;
$$;
