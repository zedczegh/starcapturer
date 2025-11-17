-- Ensure user-posts bucket is properly configured for video access

-- Update bucket to be public and allow video files
UPDATE storage.buckets 
SET 
  public = true,
  file_size_limit = 52428800, -- 50MB
  allowed_mime_types = ARRAY[
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 
    'video/x-msvideo', 'video/x-matroska'
  ]
WHERE id = 'user-posts';

-- Ensure public access policy exists
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

CREATE POLICY "Public Access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'user-posts');