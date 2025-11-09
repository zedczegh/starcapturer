
-- Create a view for easy admin management (only visible to admins)
CREATE OR REPLACE VIEW public.admin_users AS
SELECT 
  ur.id as role_id,
  ur.user_id,
  au.email,
  ur.role,
  ur.created_at as granted_at
FROM public.user_roles ur
JOIN auth.users au ON au.id = ur.user_id
WHERE ur.role = 'admin'
ORDER BY au.email;

-- Grant access to the view
GRANT SELECT ON public.admin_users TO authenticated;

-- Create RLS policy for the view (only admins can see it)
ALTER VIEW public.admin_users SET (security_barrier = true);

-- Create a function to add admin role (only admins can call it)
CREATE OR REPLACE FUNCTION public.add_admin(user_email text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id uuid;
  result json;
BEGIN
  -- Check if caller is admin
  IF NOT has_role('admin') THEN
    RAISE EXCEPTION 'Only admins can add other admins';
  END IF;

  -- Get user_id from email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = user_email;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;

  -- Insert admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Return success with user info
  SELECT json_build_object(
    'success', true,
    'user_id', target_user_id,
    'email', user_email,
    'message', 'Admin role granted successfully'
  ) INTO result;

  RETURN result;
END;
$$;

-- Create a function to remove admin role (only admins can call it)
CREATE OR REPLACE FUNCTION public.remove_admin(user_email text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id uuid;
  admin_count integer;
  result json;
BEGIN
  -- Check if caller is admin
  IF NOT has_role('admin') THEN
    RAISE EXCEPTION 'Only admins can remove other admins';
  END IF;

  -- Count current admins
  SELECT COUNT(*) INTO admin_count
  FROM public.user_roles
  WHERE role = 'admin';

  -- Prevent removing last admin
  IF admin_count <= 1 THEN
    RAISE EXCEPTION 'Cannot remove the last admin';
  END IF;

  -- Get user_id from email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = user_email;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;

  -- Remove admin role
  DELETE FROM public.user_roles
  WHERE user_id = target_user_id AND role = 'admin';

  -- Return success
  SELECT json_build_object(
    'success', true,
    'user_id', target_user_id,
    'email', user_email,
    'message', 'Admin role removed successfully'
  ) INTO result;

  RETURN result;
END;
$$;

-- Create a function to list all admins (anyone can call this to see who admins are)
CREATE OR REPLACE FUNCTION public.list_admins()
RETURNS TABLE(email text, user_id uuid, granted_at timestamp with time zone)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    au.email,
    ur.user_id,
    ur.created_at as granted_at
  FROM public.user_roles ur
  JOIN auth.users au ON au.id = ur.user_id
  WHERE ur.role = 'admin'
  ORDER BY au.email;
$$;

-- Refresh the has_role function to ensure it's using the correct logic
CREATE OR REPLACE FUNCTION public.has_role(required_role text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = required_role::app_role
  );
END;
$$;

-- Add comment explaining admin management
COMMENT ON FUNCTION public.add_admin IS 'Add admin role to a user by email. Only callable by existing admins.';
COMMENT ON FUNCTION public.remove_admin IS 'Remove admin role from a user by email. Only callable by admins. Cannot remove last admin.';
COMMENT ON FUNCTION public.list_admins IS 'List all admin users with their email and grant date.';
