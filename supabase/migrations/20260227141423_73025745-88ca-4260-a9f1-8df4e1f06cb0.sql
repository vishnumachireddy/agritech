
-- =============================================
-- BULK ORDERS & QUOTES SYSTEM
-- =============================================
CREATE TABLE public.bulk_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  consumer_id UUID NOT NULL,
  crop_name TEXT NOT NULL,
  quantity_requested NUMERIC NOT NULL DEFAULT 0,
  preferred_region TEXT,
  delivery_date DATE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.bulk_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Consumers can create bulk orders" ON public.bulk_orders
FOR INSERT WITH CHECK (auth.uid() = consumer_id);

CREATE POLICY "Consumers can view own bulk orders" ON public.bulk_orders
FOR SELECT USING (auth.uid() = consumer_id);

-- Farmers can see bulk orders matching their crop
CREATE POLICY "Farmers can view relevant bulk orders" ON public.bulk_orders
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.farmer_details fd
    WHERE fd.user_id = auth.uid() AND fd.primary_crop = bulk_orders.crop_name
  )
);

CREATE POLICY "Consumer can update own bulk orders" ON public.bulk_orders
FOR UPDATE USING (auth.uid() = consumer_id);

CREATE TABLE public.bulk_quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bulk_order_id UUID NOT NULL REFERENCES public.bulk_orders(id) ON DELETE CASCADE,
  farmer_id UUID NOT NULL,
  quoted_price NUMERIC NOT NULL DEFAULT 0,
  available_quantity NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.bulk_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Farmers can insert quotes" ON public.bulk_quotes
FOR INSERT WITH CHECK (auth.uid() = farmer_id);

CREATE POLICY "Farmers can view own quotes" ON public.bulk_quotes
FOR SELECT USING (auth.uid() = farmer_id);

CREATE POLICY "Consumers can view quotes for their orders" ON public.bulk_quotes
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.bulk_orders bo
    WHERE bo.id = bulk_quotes.bulk_order_id AND bo.consumer_id = auth.uid()
  )
);

CREATE POLICY "Consumers can update quote status" ON public.bulk_quotes
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.bulk_orders bo
    WHERE bo.id = bulk_quotes.bulk_order_id AND bo.consumer_id = auth.uid()
  )
);

-- =============================================
-- CROP TRACEABILITY
-- =============================================
CREATE TABLE public.crop_traceability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  farmer_id UUID NOT NULL,
  crop_name TEXT NOT NULL,
  harvest_date DATE,
  farm_location TEXT,
  soil_type TEXT,
  fertilizer_used TEXT,
  pesticide_used TEXT,
  certification_type TEXT DEFAULT 'None',
  sowing_date DATE,
  packaging_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.crop_traceability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Farmers can insert traceability" ON public.crop_traceability
FOR INSERT WITH CHECK (auth.uid() = farmer_id);

CREATE POLICY "Farmers can update own traceability" ON public.crop_traceability
FOR UPDATE USING (auth.uid() = farmer_id);

CREATE POLICY "Farmers can view own traceability" ON public.crop_traceability
FOR SELECT USING (auth.uid() = farmer_id);

CREATE POLICY "Consumers can view traceability for their orders" ON public.crop_traceability
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = crop_traceability.order_id AND o.consumer_id = auth.uid()
  )
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.bulk_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bulk_quotes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.crop_traceability;
