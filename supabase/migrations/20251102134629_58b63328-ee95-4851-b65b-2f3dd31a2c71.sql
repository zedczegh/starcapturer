-- Add category field to personal_uploads table
ALTER TABLE public.personal_uploads 
ADD COLUMN category text DEFAULT 'writings';

-- Add a check constraint for valid categories
ALTER TABLE public.personal_uploads
ADD CONSTRAINT valid_category CHECK (category IN ('artworks', 'work_in_progress', 'writings'));

-- Create index for category filtering
CREATE INDEX idx_personal_uploads_category ON public.personal_uploads(category, created_at DESC);