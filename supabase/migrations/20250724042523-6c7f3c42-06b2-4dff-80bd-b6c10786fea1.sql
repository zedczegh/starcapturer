-- Fix security issue: Set search path for the function
CREATE OR REPLACE FUNCTION public.update_spot_verification_status()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- When application status changes to approved or rejected, update the spot
  IF NEW.status = 'approved' THEN
    UPDATE public.user_astro_spots 
    SET verification_status = 'verified'
    WHERE id = NEW.spot_id;
  ELSIF NEW.status = 'rejected' THEN
    UPDATE public.user_astro_spots 
    SET verification_status = 'rejected'
    WHERE id = NEW.spot_id;
  END IF;
  
  RETURN NEW;
END;
$$;