-- Create post_comments table
CREATE TABLE IF NOT EXISTS public.post_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.user_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- Anyone can view comments
CREATE POLICY "Anyone can view post comments"
ON public.post_comments
FOR SELECT
USING (true);

-- Users can create their own comments
CREATE POLICY "Users can create their own comments"
ON public.post_comments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update their own comments"
ON public.post_comments
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments"
ON public.post_comments
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON public.post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON public.post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_parent ON public.post_comments(parent_comment_id);

-- Create trigger for updated_at
CREATE TRIGGER update_post_comments_updated_at
BEFORE UPDATE ON public.post_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to send interaction notifications
CREATE OR REPLACE FUNCTION public.send_interaction_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  post_owner_id UUID;
  interactor_username TEXT;
  notification_message TEXT;
BEGIN
  -- Get post owner ID
  SELECT user_id INTO post_owner_id
  FROM public.user_posts
  WHERE id = NEW.post_id;
  
  -- Don't send notification if user interacts with their own post
  IF post_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get interactor username
  SELECT COALESCE(username, 'Someone') INTO interactor_username
  FROM public.profiles
  WHERE id = NEW.user_id;
  
  -- Create notification message based on interaction type
  CASE NEW.interaction_type
    WHEN 'like' THEN
      notification_message := interactor_username || ' liked your post';
    WHEN 'heart' THEN
      notification_message := interactor_username || ' loved your post ❤️';
    WHEN 'collect' THEN
      notification_message := interactor_username || ' collected your post';
    WHEN 'share' THEN
      notification_message := interactor_username || ' shared your post';
    ELSE
      notification_message := interactor_username || ' interacted with your post';
  END CASE;
  
  -- Insert notification as a message with special metadata
  INSERT INTO public.user_messages (
    sender_id,
    receiver_id,
    message,
    metadata
  ) VALUES (
    NEW.user_id,
    post_owner_id,
    notification_message,
    jsonb_build_object(
      'type', 'post_interaction',
      'interaction_type', NEW.interaction_type,
      'post_id', NEW.post_id
    )
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for interaction notifications
DROP TRIGGER IF EXISTS notify_post_interaction ON public.post_interactions;
CREATE TRIGGER notify_post_interaction
AFTER INSERT ON public.post_interactions
FOR EACH ROW
WHEN (NEW.interaction_type IN ('like', 'heart', 'collect'))
EXECUTE FUNCTION public.send_interaction_notification();

-- Add metadata column to user_messages if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_messages' 
    AND column_name = 'metadata'
  ) THEN
    ALTER TABLE public.user_messages ADD COLUMN metadata JSONB;
  END IF;
END $$;