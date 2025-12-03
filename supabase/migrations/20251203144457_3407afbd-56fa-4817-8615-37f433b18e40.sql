-- Update get_manageable_users to show admins to admins (but owners only see all)
CREATE OR REPLACE FUNCTION public.get_manageable_users()
RETURNS TABLE(
  user_id uuid,
  email text,
  username text,
  avatar_url text,
  is_active boolean,
  role text,
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
  SELECT 
    au.id as user_id,
    au.email::text,
    p.username,
    p.avatar_url,
    COALESCE(uas.is_active, true) as is_active,
    COALESCE(ur.role, 'user')::text as role,
    au.created_at
  FROM auth.users au
  LEFT JOIN public.profiles p ON p.id = au.id
  LEFT JOIN public.user_account_status uas ON uas.user_id = au.id
  LEFT JOIN public.user_roles ur ON ur.user_id = au.id
  WHERE 
    -- If owner, show everyone except other owners
    -- If admin, show everyone except owners
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
  ORDER BY 
    CASE WHEN ur.role = 'admin' THEN 0 ELSE 1 END,
    au.created_at DESC;
END;
$$;

-- Create function to assign admin role (owner only)
CREATE OR REPLACE FUNCTION public.assign_admin_role(p_target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only owner can assign admin roles
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'owner'
  ) THEN
    RAISE EXCEPTION 'Only owner can assign admin roles';
  END IF;
  
  -- Cannot assign admin to owner
  IF EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = p_target_user_id AND role = 'owner'
  ) THEN
    RAISE EXCEPTION 'Cannot modify owner role';
  END IF;
  
  -- Insert admin role if not exists
  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_target_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN true;
END;
$$;

-- Create function to remove admin role (owner only)
CREATE OR REPLACE FUNCTION public.remove_admin_role(p_target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only owner can remove admin roles
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'owner'
  ) THEN
    RAISE EXCEPTION 'Only owner can remove admin roles';
  END IF;
  
  -- Cannot remove owner role
  IF EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = p_target_user_id AND role = 'owner'
  ) THEN
    RAISE EXCEPTION 'Cannot modify owner role';
  END IF;
  
  -- Remove admin role
  DELETE FROM public.user_roles 
  WHERE user_id = p_target_user_id AND role = 'admin';
  
  RETURN true;
END;
$$;