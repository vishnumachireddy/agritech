
-- Crops table
CREATE TABLE public.crops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  avg_yield NUMERIC DEFAULT 0,
  water_requirement NUMERIC DEFAULT 0,
  fertilizer_cost NUMERIC DEFAULT 0,
  disease_risk_index NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.crops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read crops" ON public.crops FOR SELECT TO authenticated USING (true);

-- Market prices table
CREATE TABLE public.market_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_id UUID REFERENCES public.crops(id) ON DELETE CASCADE,
  region TEXT DEFAULT '',
  price NUMERIC DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.market_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read market prices" ON public.market_prices FOR SELECT TO authenticated USING (true);

-- Weather data table
CREATE TABLE public.weather_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region TEXT DEFAULT '',
  rainfall NUMERIC DEFAULT 0,
  temperature NUMERIC DEFAULT 0,
  humidity NUMERIC DEFAULT 0,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.weather_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read weather" ON public.weather_data FOR SELECT TO authenticated USING (true);

-- Farms table
CREATE TABLE public.farms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  soil_type TEXT DEFAULT '',
  water_capacity NUMERIC DEFAULT 0,
  budget NUMERIC DEFAULT 0,
  risk_tolerance NUMERIC DEFAULT 0.5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own farms" ON public.farms FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view farms for traceability" ON public.farms FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create farms" ON public.farms FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own farms" ON public.farms FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Enable realtime for market_prices and weather_data
ALTER PUBLICATION supabase_realtime ADD TABLE public.market_prices;
ALTER PUBLICATION supabase_realtime ADD TABLE public.weather_data;
