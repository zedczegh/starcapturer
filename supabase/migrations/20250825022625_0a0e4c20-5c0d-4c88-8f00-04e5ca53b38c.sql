-- Public-safe profile access and connectivity RPCs

-- 1) Single profile (public-safe)
CREATE OR REPLACE FUNCTION public.get_public_profile(p_user_id uuid)
RETURNS TABLE (id uuid, username text, avatar_url text)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
STABLE
AS $$
  SELECT p.id, p.username, p.avatar_url
  FROM public.profiles p
  WHERE p.id = p_user_id;
$$;

-- 2) Multiple profiles (public-safe)
CREATE OR REPLACE FUNCTION public.get_public_profiles(p_user_ids uuid[])
RETURNS TABLE (id uuid, username text, avatar_url text)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
STABLE
AS $$
  SELECT p.id, p.username, p.avatar_url
  FROM public.profiles p
  WHERE p.id = ANY (p_user_ids);
$$;

-- 3) Simple DB ping
CREATE OR REPLACE FUNCTION public.ping_db()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
STABLE
AS $$
  SELECT true;
$$;

-- 4) Ensure RPCs are callable by both anon and authenticated
GRANT EXECUTE ON FUNCTION public.get_public_profile(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_profiles(uuid[]) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ping_db() TO anon, authenticated;