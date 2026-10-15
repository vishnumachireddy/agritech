
-- Create a security definer function to get user role without recursion
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = _user_id;
$$;

-- Drop and recreate the problematic UPDATE policy
DROP POLICY IF EXISTS "Users can update own profile metadata" ON public.profiles;

CREATE POLICY "Users can update own profile metadata"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id AND role = public.get_user_role(auth.uid()));
