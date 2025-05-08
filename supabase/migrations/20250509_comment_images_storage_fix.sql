
-- Make sure the bucket exists
INSERT INTO storage.buckets (id, name, public, avif_autodetection)
SELECT 'comment_images', 'comment_images', true, false
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'comment_images'
);

-- Update RLS policies for comment_images bucket with fixed permissions
-- First drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can upload comment images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view comment images" ON storage.objects;

-- Create explicit upload policy for authenticated users
CREATE POLICY "Authenticated users can upload comment images" 
  ON storage.objects 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (bucket_id = 'comment_images');

-- Create explicit policy for downloading any comment images
CREATE POLICY "Anyone can view comment images" 
  ON storage.objects 
  FOR SELECT 
  TO public 
  USING (bucket_id = 'comment_images');

-- Create explicit policy for updating own images
CREATE POLICY "Users can update their own comment images" 
  ON storage.objects 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = owner AND bucket_id = 'comment_images');

-- Create explicit policy for deleting own images
CREATE POLICY "Users can delete their own comment images" 
  ON storage.objects 
  FOR DELETE 
  TO authenticated 
  USING (auth.uid() = owner AND bucket_id = 'comment_images');

-- Ensure Row Level Security is enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Verify public access setting
UPDATE storage.buckets
SET public = true
WHERE id = 'comment_images';
