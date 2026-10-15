
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('farmer', 'consumer');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  role public.app_role NOT NULL DEFAULT 'farmer',
  region TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.email, ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'farmer')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Bulk requests table
CREATE TABLE public.bulk_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consumer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  farmer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  crop_id UUID NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.bulk_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Consumers can view own bulk requests"
  ON public.bulk_requests FOR SELECT TO authenticated
  USING (auth.uid() = consumer_id);

CREATE POLICY "Farmers can view requests sent to them"
  ON public.bulk_requests FOR SELECT TO authenticated
  USING (auth.uid() = farmer_id);

CREATE POLICY "Consumers can create bulk requests"
  ON public.bulk_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = consumer_id);

CREATE POLICY "Farmers can update request status"
  ON public.bulk_requests FOR UPDATE TO authenticated
  USING (auth.uid() = farmer_id);

-- Orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consumer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  farmer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  crop_id UUID NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'placed' CHECK (status IN ('placed', 'in-transit', 'delivered')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Consumers can view own orders"
  ON public.orders FOR SELECT TO authenticated
  USING (auth.uid() = consumer_id);

CREATE POLICY "Farmers can view orders for them"
  ON public.orders FOR SELECT TO authenticated
  USING (auth.uid() = farmer_id);

CREATE POLICY "Consumers can create orders"
  ON public.orders FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = consumer_id);

CREATE POLICY "Farmers can update order status"
  ON public.orders FOR UPDATE TO authenticated
  USING (auth.uid() = farmer_id);

-- Allow consumers to read farmer profiles (for marketplace)
CREATE POLICY "Anyone authenticated can view profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Drop the restrictive policy and keep the open one
DROP POLICY "Users can view own profile" ON public.profiles;
