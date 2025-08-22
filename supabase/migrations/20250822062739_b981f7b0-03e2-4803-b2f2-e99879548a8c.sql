-- Allow 'withdrawn' status for astro spot verification applications
ALTER TABLE public.astro_spot_verification_applications 
DROP CONSTRAINT IF EXISTS astro_spot_verification_applications_status_check;

-- Add updated constraint with withdrawn status
ALTER TABLE public.astro_spot_verification_applications 
ADD CONSTRAINT astro_spot_verification_applications_status_check 
CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn'));