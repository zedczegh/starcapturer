-- Add motto/status field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS motto TEXT;

COMMENT ON COLUMN public.profiles.motto IS 'User personal motto or status message';
