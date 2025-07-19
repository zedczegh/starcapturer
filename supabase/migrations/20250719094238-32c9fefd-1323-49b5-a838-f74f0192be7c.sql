-- Create the missing update function first
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add verification status to astro spots
ALTER TABLE public.user_astro_spots 
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected'));

-- Create verification applications table
CREATE TABLE IF NOT EXISTS public.astro_spot_verification_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  spot_id UUID NOT NULL REFERENCES public.user_astro_spots(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  bortle_level INTEGER,
  bortle_measurement_url TEXT,
  facility_images_urls TEXT[],
  accommodation_description TEXT,
  additional_notes TEXT,
  admin_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on verification applications
ALTER TABLE public.astro_spot_verification_applications ENABLE ROW LEVEL SECURITY;

-- Create policies for verification applications
CREATE POLICY "Users can create their own applications" 
ON public.astro_spot_verification_applications 
FOR INSERT 
WITH CHECK (auth.uid() = applicant_id);

CREATE POLICY "Users can view their own applications" 
ON public.astro_spot_verification_applications 
FOR SELECT 
USING (auth.uid() = applicant_id);

CREATE POLICY "Admins can view all applications" 
ON public.astro_spot_verification_applications 
FOR SELECT 
USING (has_role('admin'));

CREATE POLICY "Admins can update applications" 
ON public.astro_spot_verification_applications 
FOR UPDATE 
USING (has_role('admin'));

-- Create trigger for timestamp updates
CREATE TRIGGER update_verification_applications_updated_at
BEFORE UPDATE ON public.astro_spot_verification_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for verification materials
INSERT INTO storage.buckets (id, name, public) 
VALUES ('verification_materials', 'verification_materials', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for verification materials
CREATE POLICY "Users can upload their verification materials" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'verification_materials' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own verification materials" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'verification_materials' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all verification materials" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'verification_materials' AND has_role('admin'));