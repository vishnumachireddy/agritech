
-- Add new columns to orders table
ALTER TABLE public.orders ADD COLUMN crop_name text NOT NULL DEFAULT '';
ALTER TABLE public.orders ADD COLUMN price_per_kg numeric NOT NULL DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN updated_at timestamp with time zone NOT NULL DEFAULT now();

-- Create delivery_tracking table
CREATE TABLE public.delivery_tracking (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  current_latitude numeric NOT NULL DEFAULT 0,
  current_longitude numeric NOT NULL DEFAULT 0,
  last_updated timestamp with time zone NOT NULL DEFAULT now(),
  estimated_arrival_time timestamp with time zone,
  UNIQUE(order_id)
);

ALTER TABLE public.delivery_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Consumer can view own delivery tracking"
  ON public.delivery_tracking FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = delivery_tracking.order_id AND orders.consumer_id = auth.uid()));

CREATE POLICY "Farmer can view own delivery tracking"
  ON public.delivery_tracking FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = delivery_tracking.order_id AND orders.farmer_id = auth.uid()));

CREATE POLICY "Farmer can insert delivery tracking"
  ON public.delivery_tracking FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = delivery_tracking.order_id AND orders.farmer_id = auth.uid()));

CREATE POLICY "Farmer can update delivery tracking"
  ON public.delivery_tracking FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = delivery_tracking.order_id AND orders.farmer_id = auth.uid()));

-- Enable realtime for delivery_tracking
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_tracking;

-- Updated_at trigger for orders
CREATE OR REPLACE FUNCTION public.update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_orders_updated_at();
