-- Create buckets with correct syntax
INSERT INTO storage.buckets (id, name, public) VALUES ('comment_images', 'comment_images', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

INSERT INTO storage.buckets (id, name, public) VALUES ('message_images', 'message_images', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- Remove existing incorrect policies if they exist
DROP POLICY IF EXISTS "Public read access for comment_images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated insert for comment_images" ON storage.objects;
DROP POLICY IF EXISTS "Owner update for comment_images" ON storage.objects;
DROP POLICY IF EXISTS "Owner delete for comment_images" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for message_images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated insert for message_images" ON storage.objects;
DROP POLICY IF EXISTS "Owner update for message_images" ON storage.objects;
DROP POLICY IF EXISTS "Owner delete for message_images" ON storage.objects;

-- Create policies for comment_images bucket
CREATE POLICY "Public read access for comment_images"
ON storage.objects FOR SELECT
USING (bucket_id = 'comment_images');

CREATE POLICY "Authenticated insert for comment_images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'comment_images' AND auth.role() = 'authenticated'
);

CREATE POLICY "Owner update for comment_images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'comment_images' AND owner = auth.uid())
WITH CHECK (bucket_id = 'comment_images' AND owner = auth.uid());

CREATE POLICY "Owner delete for comment_images"
ON storage.objects FOR DELETE
USING (bucket_id = 'comment_images' AND owner = auth.uid());

-- Create policies for message_images bucket
CREATE POLICY "Public read access for message_images"
ON storage.objects FOR SELECT
USING (bucket_id = 'message_images');

CREATE POLICY "Authenticated insert for message_images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'message_images' AND auth.role() = 'authenticated'
);

CREATE POLICY "Owner update for message_images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'message_images' AND owner = auth.uid())
WITH CHECK (bucket_id = 'message_images' AND owner = auth.uid());

CREATE POLICY "Owner delete for message_images"
ON storage.objects FOR DELETE
USING (bucket_id = 'message_images' AND owner = auth.uid());