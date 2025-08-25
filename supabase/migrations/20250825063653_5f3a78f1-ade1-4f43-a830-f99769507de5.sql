-- Create/ensure storage buckets and policies for comment_images and message_images
-- Buckets (public so getPublicUrl works)
INSERT INTO storage.buckets (id, name, public) VALUES ('comment_images', 'comment_images', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

INSERT INTO storage.buckets (id, name, public) VALUES ('message_images', 'message_images', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- Policies for comment_images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND polname = 'Public read access for comment_images'
  ) THEN
    CREATE POLICY "Public read access for comment_images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'comment_images');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND polname = 'Authenticated insert for comment_images'
  ) THEN
    CREATE POLICY "Authenticated insert for comment_images"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'comment_images' AND auth.role() = 'authenticated'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND polname = 'Owner update for comment_images'
  ) THEN
    CREATE POLICY "Owner update for comment_images"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'comment_images' AND owner = auth.uid())
    WITH CHECK (bucket_id = 'comment_images' AND owner = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND polname = 'Owner delete for comment_images'
  ) THEN
    CREATE POLICY "Owner delete for comment_images"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'comment_images' AND owner = auth.uid());
  END IF;
END $$;

-- Policies for message_images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND polname = 'Public read access for message_images'
  ) THEN
    CREATE POLICY "Public read access for message_images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'message_images');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND polname = 'Authenticated insert for message_images'
  ) THEN
    CREATE POLICY "Authenticated insert for message_images"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'message_images' AND auth.role() = 'authenticated'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND polname = 'Owner update for message_images'
  ) THEN
    CREATE POLICY "Owner update for message_images"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'message_images' AND owner = auth.uid())
    WITH CHECK (bucket_id = 'message_images' AND owner = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND polname = 'Owner delete for message_images'
  ) THEN
    CREATE POLICY "Owner delete for message_images"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'message_images' AND owner = auth.uid());
  END IF;
END $$;