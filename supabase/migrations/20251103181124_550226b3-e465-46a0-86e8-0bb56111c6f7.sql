-- Add foreign key constraint between saved_astro_spots and user_astro_spots
ALTER TABLE public.saved_astro_spots
ADD CONSTRAINT saved_astro_spots_spot_id_fkey 
FOREIGN KEY (spot_id) 
REFERENCES public.user_astro_spots(id) 
ON DELETE CASCADE;