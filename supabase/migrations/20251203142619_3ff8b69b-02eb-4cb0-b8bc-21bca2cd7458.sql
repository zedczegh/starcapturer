-- Drop check constraint on user_roles if exists
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;

-- Create user account status table for deactivation
CREATE TABLE IF NOT EXISTS public.user_account_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  deactivated_at timestamp with time zone,
  deactivated_by uuid,
  reactivated_at timestamp with time zone,
  reactivated_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create user utility permissions table
CREATE TABLE IF NOT EXISTS public.user_utility_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  utility_key text NOT NULL,
  is_enabled boolean NOT NULL DEFAULT true,
  updated_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, utility_key)
);

-- Enable RLS
ALTER TABLE public.user_account_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_utility_permissions ENABLE ROW LEVEL SECURITY;

-- Assign owner role to yanzeyucq@163.com
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'owner'
FROM auth.users
WHERE email = 'yanzeyucq@163.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Create function to check if user is owner or admin
CREATE OR REPLACE FUNCTION public.is_owner_or_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
  );
$$;

-- Create function to check if user can use a utility
CREATE OR REPLACE FUNCTION public.can_use_utility(p_user_id uuid, p_utility_key text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_active boolean;
  v_utility_enabled boolean;
BEGIN
  SELECT COALESCE(is_active, true) INTO v_is_active
  FROM public.user_account_status
  WHERE user_id = p_user_id;
  
  IF v_is_active IS FALSE THEN
    RETURN false;
  END IF;
  
  SELECT COALESCE(is_enabled, true) INTO v_utility_enabled
  FROM public.user_utility_permissions
  WHERE user_id = p_user_id AND utility_key = p_utility_key;
  
  RETURN COALESCE(v_utility_enabled, true);
END;
$$;

-- Create function to get all users for admin management
CREATE OR REPLACE FUNCTION public.get_manageable_users()
RETURNS TABLE (
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
BEGIN
  IF NOT is_owner_or_admin() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
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
  WHERE NOT EXISTS (
    SELECT 1 FROM public.user_roles r 
    WHERE r.user_id = au.id AND r.role IN ('owner', 'admin')
  )
  ORDER BY au.created_at DESC;
END;
$$;

-- Create function to get user utility permissions
CREATE OR REPLACE FUNCTION public.get_user_utility_permissions(p_user_id uuid)
RETURNS TABLE (
  utility_key text,
  is_enabled boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT utility_key, is_enabled
  FROM public.user_utility_permissions
  WHERE user_id = p_user_id;
$$;

-- RLS Policies for user_account_status
CREATE POLICY "Owner and admins can view all account status"
  ON public.user_account_status FOR SELECT
  USING (is_owner_or_admin());

CREATE POLICY "Owner and admins can insert account status"
  ON public.user_account_status FOR INSERT
  WITH CHECK (is_owner_or_admin());

CREATE POLICY "Owner and admins can update account status"
  ON public.user_account_status FOR UPDATE
  USING (is_owner_or_admin());

CREATE POLICY "Owner and admins can delete account status"
  ON public.user_account_status FOR DELETE
  USING (is_owner_or_admin());

-- RLS Policies for user_utility_permissions
CREATE POLICY "Owner and admins can view all utility permissions"
  ON public.user_utility_permissions FOR SELECT
  USING (is_owner_or_admin());

CREATE POLICY "Users can view their own utility permissions"
  ON public.user_utility_permissions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Owner and admins can manage utility permissions"
  ON public.user_utility_permissions FOR ALL
  USING (is_owner_or_admin());