-- Fix storage policies for comment_images bucket with correct column names
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow upload to comment_images for authenticated users'
  ) THEN
    CREATE POLICY "Allow upload to comment_images for authenticated users"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'comment_images');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow read of comment_images'
  ) THEN
    CREATE POLICY "Allow read of comment_images"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'comment_images');
  END IF;
END $$;

-- Ensure the comment_images bucket exists and is public
INSERT INTO storage.buckets (id, name, public) 
VALUES ('comment_images', 'comment_images', true)
ON CONFLICT (id) DO UPDATE SET 
  public = EXCLUDED.public;