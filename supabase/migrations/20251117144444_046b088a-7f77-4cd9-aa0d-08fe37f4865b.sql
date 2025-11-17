-- Update user-posts bucket to support video uploads (50MB limit)
UPDATE storage.buckets 
SET file_size_limit = 52428800 
WHERE id = 'user-posts';