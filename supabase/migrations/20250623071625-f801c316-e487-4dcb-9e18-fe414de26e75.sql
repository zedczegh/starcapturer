
-- Add pricing fields to astro_spot_timeslots table
ALTER TABLE public.astro_spot_timeslots 
ADD COLUMN is_free BOOLEAN NOT NULL DEFAULT false;

-- Update existing records to have default pricing values
UPDATE public.astro_spot_timeslots 
SET price = 0, currency = 'USD', is_free = true 
WHERE price IS NULL OR price = 0;

-- Add currency support for user preferences
ALTER TABLE public.profiles
ADD COLUMN preferred_currency TEXT DEFAULT 'USD';
