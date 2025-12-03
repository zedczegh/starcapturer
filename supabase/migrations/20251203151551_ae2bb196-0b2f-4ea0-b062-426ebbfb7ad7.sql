-- Update get_manageable_users to also return is_admin flag for showing both badges
DROP FUNCTION IF EXISTS public.get_manageable_users();

CREATE OR REPLACE FUNCTION public.get_manageable_users()
RETURNS TABLE(
  user_id uuid, 
  email text, 
  username text, 
  avatar_url text, 
  is_active boolean, 
  role text,
  is_admin boolean,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_owner boolean;
BEGIN
  IF NOT is_owner_or_admin() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  -- Check if current user is owner
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles r 
    WHERE r.user_id = auth.uid() AND r.role = 'owner'
  ) INTO v_is_owner;
  
  RETURN QUERY
  SELECT DISTINCT ON (au.id)
    au.id as user_id,
    au.email::text,
    p.username,
    p.avatar_url,
    COALESCE(uas.is_active, true) as is_active,
    -- Prioritize owner > admin > user for primary display role
    COALESCE(
      (SELECT r.role FROM public.user_roles r WHERE r.user_id = au.id ORDER BY 
        CASE r.role 
          WHEN 'owner' THEN 1 
          WHEN 'admin' THEN 2 
          ELSE 3 
        END 
        LIMIT 1
      ), 
      'user'
    )::text as role,
    -- Also check if user has admin role (for showing both badges)
    EXISTS(SELECT 1 FROM public.user_roles r WHERE r.user_id = au.id AND r.role = 'admin') as is_admin,
    au.created_at
  FROM auth.users au
  LEFT JOIN public.profiles p ON p.id = au.id
  LEFT JOIN public.user_account_status uas ON uas.user_id = au.id
  WHERE 
    CASE 
      WHEN v_is_owner THEN 
        NOT EXISTS (
          SELECT 1 FROM public.user_roles r 
          WHERE r.user_id = au.id AND r.role = 'owner' AND au.id != auth.uid()
        )
      ELSE
        NOT EXISTS (
          SELECT 1 FROM public.user_roles r 
          WHERE r.user_id = au.id AND r.role = 'owner'
        )
    END
  ORDER BY au.id, au.created_at DESC;
END;
$$;