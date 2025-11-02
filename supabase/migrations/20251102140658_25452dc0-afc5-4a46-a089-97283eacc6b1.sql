-- Create storage policies for personal-uploads bucket
-- Allow the specific user to upload files
CREATE POLICY "Allow specific user to upload files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'personal-uploads' 
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND (auth.jwt() ->> 'email'::text) = 'yanzeyucq@163.com'
);

-- Allow the specific user to view their own files
CREATE POLICY "Allow specific user to view their files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'personal-uploads'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND (auth.jwt() ->> 'email'::text) = 'yanzeyucq@163.com'
);

-- Allow the specific user to delete their own files
CREATE POLICY "Allow specific user to delete their files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'personal-uploads'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND (auth.jwt() ->> 'email'::text) = 'yanzeyucq@163.com'
);

-- Allow the specific user to update their own files
CREATE POLICY "Allow specific user to update their files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'personal-uploads'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND (auth.jwt() ->> 'email'::text) = 'yanzeyucq@163.com'
);

-- Make sure the bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('personal-uploads', 'personal-uploads', true)
ON CONFLICT (id) DO UPDATE SET public = true;