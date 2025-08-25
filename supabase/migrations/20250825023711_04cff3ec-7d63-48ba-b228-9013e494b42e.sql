-- Ensure storage policies for comment_images uploads and reads

-- Allow public read access to comment images (optional if bucket is public)
DROP POLICY IF EXISTS "Public can view comment_images" ON storage.objects;
CREATE POLICY "Public can view comment_images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'comment_images');

-- Allow authenticated users to upload to comment_images
DROP POLICY IF EXISTS "Authenticated can upload comment_images" ON storage.objects;
CREATE POLICY "Authenticated can upload comment_images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'comment_images');