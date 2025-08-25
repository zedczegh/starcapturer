-- Add support for multiple images in comments
-- Add image_urls array column to store multiple image URLs
ALTER TABLE public.astro_spot_comments 
ADD COLUMN image_urls TEXT[];

-- Create index for better performance on image_urls queries
CREATE INDEX idx_astro_spot_comments_image_urls ON public.astro_spot_comments USING GIN(image_urls);

-- Update existing comments that have image_url to move it to image_urls array
UPDATE public.astro_spot_comments 
SET image_urls = ARRAY[image_url] 
WHERE image_url IS NOT NULL AND image_url != '';

-- Note: We'll keep the old image_url column for backward compatibility initially
-- but new comments will use image_urls array