
-- Add the pets_policy column to the astro_spot_timeslots table
ALTER TABLE public.astro_spot_timeslots 
ADD COLUMN IF NOT EXISTS pets_policy TEXT DEFAULT 'not_allowed';

-- Add the metadata column to store guest information in the astro_spot_reservations table
ALTER TABLE public.astro_spot_reservations 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT NULL;
