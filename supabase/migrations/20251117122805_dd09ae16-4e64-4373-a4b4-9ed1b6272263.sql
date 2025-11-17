-- Create post_interactions table for likes, hearts, shares, and collects
CREATE TABLE IF NOT EXISTS public.post_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  post_id UUID NOT NULL REFERENCES public.user_posts(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('like', 'heart', 'share', 'collect')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id, interaction_type)
);

-- Enable RLS
ALTER TABLE public.post_interactions ENABLE ROW LEVEL SECURITY;

-- Anyone can view interactions
CREATE POLICY "Anyone can view post interactions"
ON public.post_interactions
FOR SELECT
USING (true);

-- Users can create their own interactions
CREATE POLICY "Users can create their own interactions"
ON public.post_interactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own interactions
CREATE POLICY "Users can delete their own interactions"
ON public.post_interactions
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_post_interactions_post_id ON public.post_interactions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_interactions_user_id ON public.post_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_post_interactions_type ON public.post_interactions(interaction_type);