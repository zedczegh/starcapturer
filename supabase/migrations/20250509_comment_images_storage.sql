
-- Create the comment_images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, avif_autodetection)
SELECT 'comment_images', 'comment_images', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'comment_images'
);

-- Set RLS policies for the comment_images bucket
-- Allow any authenticated user to upload files
CREATE POLICY "Anyone can upload comment images" 
  ON storage.objects 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    bucket_id = 'comment_images'
  );

-- Allow anyone to read comment images (public access)
CREATE POLICY "Anyone can view comment images" 
  ON storage.objects 
  FOR SELECT 
  TO public 
  USING (
    bucket_id = 'comment_images'
  );

-- Enable RLS on storage.objects table (just to be extra safe)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
