
-- Fix status constraint to match actual application status values
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('pending', 'accepted', 'rejected', 'packed', 'out_for_delivery', 'delivered'));

-- Update default to 'pending' to match app code
ALTER TABLE public.orders ALTER COLUMN status SET DEFAULT 'pending';
