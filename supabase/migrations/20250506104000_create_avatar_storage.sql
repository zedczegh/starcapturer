
-- This migration ensures the avatars bucket exists
-- First, check if bucket already exists to prevent errors
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM storage.buckets WHERE id = 'avatars'
  ) THEN
    INSERT INTO storage.buckets (id, name, public) 
    VALUES ('avatars', 'avatars', true);
    
    -- Create policy to allow authenticated users to upload their own avatars
    INSERT INTO storage.policies (name, definition, table_name, rows_limit, operation, bucket_id, allowed_mime_types)
    VALUES (
      'Avatar upload policy',
      '((bucket_id = ''avatars''::text) AND (auth.uid() = (storage.foldername(name))[1]::uuid))',
      'objects',
      NULL,
      'INSERT',
      'avatars',
      '{image/png,image/jpeg,image/gif,image/webp}'
    );
    
    -- Create policy to allow users to update their own avatars
    INSERT INTO storage.policies (name, definition, table_name, rows_limit, operation, bucket_id)
    VALUES (
      'Avatar update policy',
      '((bucket_id = ''avatars''::text) AND (auth.uid() = (storage.foldername(name))[1]::uuid))',
      'objects',
      NULL,
      'UPDATE',
      'avatars'
    );
    
    -- Create policy to allow users to delete their own avatars
    INSERT INTO storage.policies (name, definition, table_name, rows_limit, operation, bucket_id)
    VALUES (
      'Avatar delete policy',
      '((bucket_id = ''avatars''::text) AND (auth.uid() = (storage.foldername(name))[1]::uuid))',
      'objects',
      NULL,
      'DELETE',
      'avatars'
    );
    
    -- Create policy to allow public access to avatars (read only)
    INSERT INTO storage.policies (name, definition, table_name, rows_limit, operation, bucket_id)
    VALUES (
      'Avatar download policy',
      '(bucket_id = ''avatars''::text)',
      'objects',
      NULL,
      'SELECT',
      'avatars'
    );
  END IF;
END $$;
