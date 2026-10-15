
-- Add speed column to delivery_tracking
ALTER TABLE public.delivery_tracking ADD COLUMN IF NOT EXISTS speed numeric DEFAULT 0;
