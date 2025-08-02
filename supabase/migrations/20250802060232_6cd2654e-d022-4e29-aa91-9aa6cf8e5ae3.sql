-- Create verification materials bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('verification-materials', 'verification-materials', true);

-- Create policies for verification materials bucket
CREATE POLICY "Anyone can view verification materials" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'verification-materials');

CREATE POLICY "Authenticated users can upload verification materials" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'verification-materials' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own verification materials" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'verification-materials' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own verification materials" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'verification-materials' AND auth.uid()::text = (storage.foldername(name))[1]);