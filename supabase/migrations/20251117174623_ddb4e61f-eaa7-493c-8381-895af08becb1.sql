-- Add foreign key relationship between post_comments and profiles
ALTER TABLE public.post_comments
ADD CONSTRAINT post_comments_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;