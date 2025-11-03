-- Fix 1: Add INSERT policy for profiles table (CRITICAL)
CREATE POLICY "Service role can insert profiles" 
ON public.profiles 
FOR INSERT 
TO service_role 
WITH CHECK (true);

-- Fix 2: Secure siqs_calculation_entries table (CRITICAL)
-- First, delete entries with NULL user_id (anonymous entries)
DELETE FROM public.siqs_calculation_entries WHERE user_id IS NULL;

-- Now make user_id NOT NULL
ALTER TABLE public.siqs_calculation_entries 
ALTER COLUMN user_id SET NOT NULL;

-- Update INSERT policy to require authentication
DROP POLICY IF EXISTS "Allow authenticated users to insert siqs calculations" ON public.siqs_calculation_entries;
CREATE POLICY "Authenticated users can insert their own calculations" 
ON public.siqs_calculation_entries 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Fix 3: Make message_images bucket private (CRITICAL)
UPDATE storage.buckets 
SET public = false 
WHERE id = 'message_images';

-- Remove existing policies if any
DROP POLICY IF EXISTS "Users can upload their own message images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view message images in their conversations" ON storage.objects;

-- Add storage policies for message_images bucket
CREATE POLICY "Users can upload their own message images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'message_images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view message images in their conversations"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'message_images' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM public.user_messages
      WHERE image_url LIKE '%' || name || '%'
      AND (sender_id = auth.uid() OR receiver_id = auth.uid())
    )
  )
);