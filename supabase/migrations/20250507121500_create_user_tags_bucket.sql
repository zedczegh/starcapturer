
-- Create a bucket for user_tags if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
SELECT 'user_tags', 'user_tags', true
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'user_tags'
);

-- Set up RLS policy for the user_tags bucket
CREATE POLICY "User tags are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'user_tags');

-- Allow authenticated users to upload icons
CREATE POLICY "Users can upload tag icons"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'user_tags' AND
  auth.role() = 'authenticated'
);

-- Allow users to update tag icons
CREATE POLICY "Users can update tag icons"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'user_tags' AND
  auth.role() = 'authenticated'
);

-- Allow users to delete tag icons
CREATE POLICY "Users can delete tag icons"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'user_tags' AND
  auth.role() = 'authenticated'
);
