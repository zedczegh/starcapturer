-- Fix storage policies for user-posts bucket to ensure videos are accessible

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read access for user posts" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own posts" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own posts" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own posts" ON storage.objects;

-- Create comprehensive policies for user-posts bucket
CREATE POLICY "Public read access for user posts"
ON storage.objects
FOR SELECT
USING (bucket_id = 'user-posts');

CREATE POLICY "Users can upload their own posts"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'user-posts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own posts"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'user-posts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own posts"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'user-posts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);