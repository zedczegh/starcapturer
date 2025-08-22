-- Drop the trigger first, then recreate the function with proper security settings
DROP TRIGGER IF EXISTS update_saved_astro_spots_updated_at ON public.saved_astro_spots;
DROP FUNCTION IF EXISTS public.update_saved_astro_spots_updated_at() CASCADE;

-- Recreate the function with proper security settings
CREATE OR REPLACE FUNCTION public.update_saved_astro_spots_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Recreate the trigger
CREATE TRIGGER update_saved_astro_spots_updated_at
BEFORE UPDATE ON public.saved_astro_spots
FOR EACH ROW
EXECUTE FUNCTION public.update_saved_astro_spots_updated_at();