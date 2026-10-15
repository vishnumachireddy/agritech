-- Enable realtime for orders (delivery_tracking already enabled)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
END $$;

-- Add order status transition validation trigger
CREATE OR REPLACE FUNCTION public.validate_order_status_transition()
RETURNS TRIGGER AS $$
DECLARE
  valid_transitions TEXT[];
BEGIN
  valid_transitions := CASE OLD.status
    WHEN 'pending' THEN ARRAY['accepted', 'rejected']
    WHEN 'accepted' THEN ARRAY['packed']
    WHEN 'packed' THEN ARRAY['out_for_delivery']
    WHEN 'out_for_delivery' THEN ARRAY['delivered']
    WHEN 'rejected' THEN ARRAY[]::TEXT[]
    WHEN 'delivered' THEN ARRAY[]::TEXT[]
    ELSE ARRAY[]::TEXT[]
  END;

  IF NOT (NEW.status = ANY(valid_transitions)) THEN
    RAISE EXCEPTION 'Invalid status transition from % to %', OLD.status, NEW.status;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS enforce_order_status_transition ON public.orders;
CREATE TRIGGER enforce_order_status_transition
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.validate_order_status_transition();
