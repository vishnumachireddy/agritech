
-- Drop overly permissive SELECT policy
DROP POLICY IF EXISTS "Anyone authenticated can view profiles" ON public.profiles;

-- Users can always view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can view profiles of people they have orders with
CREATE POLICY "Users can view transaction partner profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE (o.farmer_id = auth.uid() AND o.consumer_id = profiles.id)
         OR (o.consumer_id = auth.uid() AND o.farmer_id = profiles.id)
    )
  );

-- Create a public view for marketplace browsing (excludes sensitive email/phone)
CREATE OR REPLACE VIEW public.public_farmer_profiles AS
SELECT id, full_name, region, role
FROM public.profiles
WHERE role = 'farmer';

-- Grant access to authenticated users
GRANT SELECT ON public.public_farmer_profiles TO authenticated;

-- Enable RLS-safe access: the view uses SECURITY INVOKER by default,
-- but since we dropped the broad policy, we need to allow the view
-- to work. We'll use a security definer function instead.

-- Create a function to get public farmer profiles safely
CREATE OR REPLACE FUNCTION public.get_public_farmer_profiles()
RETURNS TABLE(id uuid, full_name text, region text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.full_name, p.region
  FROM public.profiles p
  WHERE p.role = 'farmer';
$$;

-- Create a function to count farmers
CREATE OR REPLACE FUNCTION public.count_farmers()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::bigint FROM public.profiles WHERE role = 'farmer';
$$;
