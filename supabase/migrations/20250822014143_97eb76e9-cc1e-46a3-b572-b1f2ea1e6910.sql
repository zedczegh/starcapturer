-- Make the verification_materials bucket public for image display
UPDATE storage.buckets 
SET public = true 
WHERE id = 'verification_materials';

-- Create policies for the verification_materials bucket (with underscores)
CREATE POLICY "Anyone can view verification materials files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'verification_materials');