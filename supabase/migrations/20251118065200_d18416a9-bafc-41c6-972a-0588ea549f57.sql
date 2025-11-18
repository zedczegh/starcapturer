-- Create user_follows table for follow/following relationships
CREATE TABLE public.user_follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Enable RLS
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- Anyone can view follows
CREATE POLICY "Anyone can view follows"
ON public.user_follows
FOR SELECT
USING (true);

-- Users can follow others
CREATE POLICY "Users can follow others"
ON public.user_follows
FOR INSERT
WITH CHECK (auth.uid() = follower_id AND follower_id != following_id);

-- Users can unfollow
CREATE POLICY "Users can unfollow"
ON public.user_follows
FOR DELETE
USING (auth.uid() = follower_id);

-- Create indexes for better performance
CREATE INDEX idx_user_follows_follower ON public.user_follows(follower_id);
CREATE INDEX idx_user_follows_following ON public.user_follows(following_id);

-- Create function to get follower count
CREATE OR REPLACE FUNCTION public.get_follower_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.user_follows
  WHERE following_id = p_user_id;
$$;

-- Create function to get following count
CREATE OR REPLACE FUNCTION public.get_following_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.user_follows
  WHERE follower_id = p_user_id;
$$;

-- Create function to check if user is following another user
CREATE OR REPLACE FUNCTION public.is_following(p_follower_id UUID, p_following_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_follows
    WHERE follower_id = p_follower_id
      AND following_id = p_following_id
  );
$$;