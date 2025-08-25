-- Ensure storage policies for comment_images bucket
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND polname = 'Allow upload to comment_images for authenticated users'
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
    WHERE schemaname = 'storage' AND tablename = 'objects' AND polname = 'Allow read of comment_images'
  ) THEN
    CREATE POLICY "Allow read of comment_images"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'comment_images');
  END IF;
END $$;
