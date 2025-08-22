-- Fix the update function to follow security patterns
DROP FUNCTION IF EXISTS public.update_saved_astro_spots_updated_at();

CREATE OR REPLACE FUNCTION public.update_saved_astro_spots_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';