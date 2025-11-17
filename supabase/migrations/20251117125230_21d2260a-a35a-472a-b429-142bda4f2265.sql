-- Add support for multiple images per post
ALTER TABLE public.user_posts 
ADD COLUMN IF NOT EXISTS images jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.user_posts.images IS 'Array of image paths for posts with multiple images';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_user_posts_images ON public.user_posts USING gin(images);