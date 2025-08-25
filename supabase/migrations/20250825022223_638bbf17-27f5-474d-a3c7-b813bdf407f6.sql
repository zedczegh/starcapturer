-- Restrict public read access to profiles
-- 1) Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- 2) Allow only authenticated users to read profiles
CREATE POLICY "Authenticated users can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Keep existing self-view/update policies intact