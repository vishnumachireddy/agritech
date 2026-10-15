-- Create bulk_orders table
CREATE TABLE IF NOT EXISTS public.bulk_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES auth.users(id),
    crop_name TEXT NOT NULL,
    quantity_required FLOAT NOT NULL,
    unit TEXT CHECK (unit IN ('kg', 'ton', 'quintal')),
    region TEXT,
    expected_delivery_start DATE,
    expected_delivery_end DATE,
    status TEXT DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create crop_demands table
CREATE TABLE IF NOT EXISTS public.crop_demands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bulk_order_id UUID REFERENCES public.bulk_orders(id) ON DELETE CASCADE,
    crop_name TEXT NOT NULL,
    total_quantity FLOAT NOT NULL,
    region TEXT,
    demand_status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create farmer_commitments table
CREATE TABLE IF NOT EXISTS public.farmer_commitments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID REFERENCES auth.users(id),
    demand_id UUID REFERENCES public.crop_demands(id) ON DELETE CASCADE,
    committed_quantity FLOAT NOT NULL,
    status TEXT DEFAULT 'committed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Trigger to auto-create crop_demand when bulk_order is created
CREATE OR REPLACE FUNCTION public.handle_new_bulk_order()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.crop_demands (bulk_order_id, crop_name, total_quantity, region)
    VALUES (NEW.id, NEW.crop_name, NEW.quantity_required, NEW.region);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to avoid errors on multiple runs
DROP TRIGGER IF EXISTS on_bulk_order_created ON public.bulk_orders;

CREATE TRIGGER on_bulk_order_created
    AFTER INSERT ON public.bulk_orders
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_bulk_order();

-- Enable RLS
ALTER TABLE public.bulk_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crop_demands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmer_commitments ENABLE ROW LEVEL SECURITY;

-- Policies
-- Drop existing policies if they exist to avoid errors
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Customers can create bulk orders" ON public.bulk_orders;
    DROP POLICY IF EXISTS "Customers can view their own bulk orders" ON public.bulk_orders;
    DROP POLICY IF EXISTS "Everyone can view crop demands" ON public.crop_demands;
    DROP POLICY IF EXISTS "Farmers can create commitments" ON public.farmer_commitments;
    DROP POLICY IF EXISTS "Everyone can view farmer commitments" ON public.farmer_commitments;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

CREATE POLICY "Customers can create bulk orders" ON public.bulk_orders FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Customers can view their own bulk orders" ON public.bulk_orders FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Everyone can view crop demands" ON public.crop_demands FOR SELECT USING (true);
CREATE POLICY "Farmers can create commitments" ON public.farmer_commitments FOR INSERT WITH CHECK (auth.uid() = farmer_id);
CREATE POLICY "Everyone can view farmer commitments" ON public.farmer_commitments FOR SELECT USING (true);
CREATE POLICY "Farmers can view crop demands" ON public.crop_demands FOR SELECT USING (true);
CREATE POLICY "Customers can view crop demands" ON public.crop_demands FOR SELECT USING (true);
