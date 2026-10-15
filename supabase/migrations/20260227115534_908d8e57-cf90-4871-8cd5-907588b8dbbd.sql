
-- 1. Prevent users from changing their own role
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile metadata"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
  );

-- 2. Sanitize handle_new_user trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_full_name TEXT;
  v_phone TEXT;
  v_role TEXT;
BEGIN
  v_full_name := TRIM(COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  IF LENGTH(v_full_name) > 200 THEN
    v_full_name := SUBSTRING(v_full_name, 1, 200);
  END IF;

  v_phone := REGEXP_REPLACE(
    TRIM(COALESCE(NEW.raw_user_meta_data->>'phone', '')),
    '[^0-9+\-\s()]',
    '',
    'g'
  );
  IF LENGTH(v_phone) > 20 THEN
    v_phone := SUBSTRING(v_phone, 1, 20);
  END IF;

  v_role := LOWER(TRIM(COALESCE(NEW.raw_user_meta_data->>'role', 'farmer')));
  IF v_role NOT IN ('farmer', 'consumer') THEN
    v_role := 'farmer';
  END IF;

  INSERT INTO public.profiles (id, full_name, email, phone, role)
  VALUES (
    NEW.id,
    v_full_name,
    COALESCE(NEW.email, ''),
    v_phone,
    v_role::public.app_role
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- 3. Add CHECK constraints for input validation
ALTER TABLE public.orders
  ADD CONSTRAINT orders_quantity_valid CHECK (quantity > 0 AND quantity <= 1000000),
  ADD CONSTRAINT orders_price_valid CHECK (price_per_kg >= 0 AND total_price >= 0);

ALTER TABLE public.bulk_requests
  ADD CONSTRAINT bulk_quantity_valid CHECK (quantity > 0 AND quantity <= 1000000);

ALTER TABLE public.farmer_details
  ADD CONSTRAINT farmer_values_valid CHECK (
    land_area >= 0 AND land_area <= 100000 AND
    total_yield >= 0 AND
    monthly_production >= 0 AND
    expected_price >= 0
  );

-- 4. Add order price validation trigger
CREATE OR REPLACE FUNCTION public.validate_order()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.total_price != (NEW.quantity * NEW.price_per_kg) THEN
    RAISE EXCEPTION 'Price calculation mismatch';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER check_order_before_insert
BEFORE INSERT OR UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.validate_order();
