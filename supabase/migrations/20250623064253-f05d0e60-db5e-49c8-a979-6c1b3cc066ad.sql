
-- Add check-in and check-out timestamps to astro_spot_reservations table
ALTER TABLE public.astro_spot_reservations 
ADD COLUMN checked_in_at TIMESTAMP WITH TIME ZONE NULL,
ADD COLUMN checked_out_at TIMESTAMP WITH TIME ZONE NULL,
ADD COLUMN host_notes TEXT NULL;

-- Update the status enum to include check-in/check-out states
-- We'll use the existing status field with new values: 'confirmed', 'checked_in', 'checked_out', 'cancelled'
-- No need to alter the column since it's already text type
