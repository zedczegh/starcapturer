-- Update avatars bucket to allow larger file sizes (10MB is reasonable for background images)
UPDATE storage.buckets
SET file_size_limit = 10485760  -- 10MB in bytes
WHERE id = 'avatars';