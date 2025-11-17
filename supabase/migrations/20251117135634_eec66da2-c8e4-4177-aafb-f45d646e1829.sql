
-- Clean up conflicting storage policies for avatars bucket
-- Remove policies that use 'owner' which doesn't work for INSERT operations

-- Drop old conflicting policies
DROP POLICY IF EXISTS "Allow users to upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to view avatars" ON storage.objects;

-- Drop any existing versions of our new policies to recreate them cleanly
DROP POLICY IF EXISTS "Users can upload to own folder in avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files in avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files in avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public can read avatars bucket" ON storage.objects;

-- Create clean, working policies using foldername check

-- Allow authenticated users to upload to their own folder (userId/filename)
CREATE POLICY "Users can upload to own folder in avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own files
CREATE POLICY "Users can update own files in avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own files  
CREATE POLICY "Users can delete own files in avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access (bucket is public)
CREATE POLICY "Public can read avatars bucket"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');
