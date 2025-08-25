-- Clean up ALL duplicate policies for comment_images bucket
DROP POLICY IF EXISTS "Allow authenticated users to upload comment images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to comment images" ON storage.objects;
DROP POLICY IF EXISTS "Allow read of comment_images" ON storage.objects;
DROP POLICY IF EXISTS "Allow upload to comment_images for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload comment_images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated insert for comment_images" ON storage.objects;
DROP POLICY IF EXISTS "Owner delete for comment_images" ON storage.objects;
DROP POLICY IF EXISTS "Owner update for comment_images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view comment_images" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for comment_images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own comment images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own comment images" ON storage.objects;

-- Create ONE clean set of policies for comment_images
CREATE POLICY "comment_images_select" ON storage.objects
FOR SELECT USING (bucket_id = 'comment_images');

CREATE POLICY "comment_images_insert" ON storage.objects  
FOR INSERT WITH CHECK (
  bucket_id = 'comment_images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "comment_images_update" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'comment_images' 
  AND owner = auth.uid()
);

CREATE POLICY "comment_images_delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'comment_images' 
  AND owner = auth.uid()
);