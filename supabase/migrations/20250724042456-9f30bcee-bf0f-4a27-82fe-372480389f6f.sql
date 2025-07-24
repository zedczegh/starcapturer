-- Create function to update astro spot verification status based on application status
CREATE OR REPLACE FUNCTION public.update_spot_verification_status()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update spot status when application status changes
CREATE TRIGGER update_spot_verification_on_application_change
  AFTER UPDATE ON public.astro_spot_verification_applications
  FOR EACH ROW
  WHEN (OLD.status != NEW.status)
  EXECUTE FUNCTION public.update_spot_verification_status();

-- Update existing spots based on their current application status
UPDATE public.user_astro_spots 
SET verification_status = CASE 
  WHEN EXISTS (
    SELECT 1 FROM public.astro_spot_verification_applications 
    WHERE spot_id = user_astro_spots.id 
    AND status = 'approved'
  ) THEN 'verified'
  WHEN EXISTS (
    SELECT 1 FROM public.astro_spot_verification_applications 
    WHERE spot_id = user_astro_spots.id 
    AND status = 'rejected'
  ) THEN 'rejected'
  WHEN EXISTS (
    SELECT 1 FROM public.astro_spot_verification_applications 
    WHERE spot_id = user_astro_spots.id 
    AND status = 'pending'
  ) THEN 'pending'
  ELSE 'unverified'
END;