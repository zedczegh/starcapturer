-- Create storage policies for verification_materials bucket (if not exists)
-- First ensure the bucket exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('verification_materials', 'verification_materials', false)
ON CONFLICT (id) DO NOTHING;

-- Create policies for verification materials
CREATE POLICY "Admins can view all verification materials" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'verification_materials' AND has_role('admin'));

CREATE POLICY "Authenticated users can upload verification materials" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'verification_materials' AND auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage all verification materials" 
ON storage.objects 
FOR ALL 
USING (bucket_id = 'verification_materials' AND has_role('admin'));