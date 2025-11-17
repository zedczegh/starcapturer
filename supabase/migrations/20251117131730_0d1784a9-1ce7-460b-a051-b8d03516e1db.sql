-- Add background image URL column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS background_image_url TEXT;

COMMENT ON COLUMN public.profiles.background_image_url IS 'URL to user profile background image';
