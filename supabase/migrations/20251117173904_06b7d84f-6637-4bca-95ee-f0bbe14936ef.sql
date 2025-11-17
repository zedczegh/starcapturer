-- Add foreign key relationship between user_posts and profiles
ALTER TABLE public.user_posts
ADD CONSTRAINT user_posts_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;