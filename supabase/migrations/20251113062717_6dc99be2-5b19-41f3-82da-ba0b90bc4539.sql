-- Create user_posts table for all user posts (similar to personal_uploads but public-viewable)
CREATE TABLE IF NOT EXISTS public.user_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_featured_album table for featured images
CREATE TABLE IF NOT EXISTS public.user_featured_album (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_path TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_featured_album ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_posts (anyone can view, only owner can modify)
CREATE POLICY "Anyone can view posts"
  ON public.user_posts
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own posts"
  ON public.user_posts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
  ON public.user_posts
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
  ON public.user_posts
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for user_featured_album (anyone can view, only owner can modify)
CREATE POLICY "Anyone can view featured albums"
  ON public.user_featured_album
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own featured images"
  ON public.user_featured_album
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own featured images"
  ON public.user_featured_album
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own featured images"
  ON public.user_featured_album
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create storage bucket for user posts if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-posts', 'user-posts', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for user-posts bucket
CREATE POLICY "Anyone can view user posts"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'user-posts');

CREATE POLICY "Users can upload their own posts"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'user-posts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own posts"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'user-posts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own posts"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'user-posts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add trigger for updated_at
CREATE TRIGGER update_user_posts_updated_at
  BEFORE UPDATE ON public.user_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();