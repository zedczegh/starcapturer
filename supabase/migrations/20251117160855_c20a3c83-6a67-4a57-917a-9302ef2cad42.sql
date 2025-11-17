-- Create astro_spot_comment_likes table
CREATE TABLE IF NOT EXISTS public.astro_spot_comment_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id uuid NOT NULL REFERENCES public.astro_spot_comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- Enable RLS
ALTER TABLE public.astro_spot_comment_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view comment likes"
  ON public.astro_spot_comment_likes
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own likes"
  ON public.astro_spot_comment_likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes"
  ON public.astro_spot_comment_likes
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_astro_spot_comment_likes_comment_id ON public.astro_spot_comment_likes(comment_id);
CREATE INDEX idx_astro_spot_comment_likes_user_id ON public.astro_spot_comment_likes(user_id);