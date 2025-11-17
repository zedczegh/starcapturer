-- Update avatars bucket to allow 100MB file sizes for background images
UPDATE storage.buckets
SET file_size_limit = 104857600  -- 100MB in bytes
WHERE id = 'avatars';