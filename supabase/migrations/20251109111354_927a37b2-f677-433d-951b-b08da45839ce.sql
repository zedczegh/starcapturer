
-- Fix the has_role function type casting issue
CREATE OR REPLACE FUNCTION public.has_role(required_role text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Cast the text parameter to app_role enum before comparison
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = required_role::app_role
  );
EXCEPTION
  WHEN invalid_text_representation THEN
    -- Handle invalid role names gracefully
    RETURN false;
END;
$$;

-- Test the function with all three admin emails
DO $$
DECLARE
  admin_emails text[] := ARRAY['yanzeyucq@163.com', '13985567968@163.com', '17708516715@163.com'];
  admin_email text;
  admin_user_id uuid;
  has_admin boolean;
BEGIN
  FOREACH admin_email IN ARRAY admin_emails
  LOOP
    -- Get user_id for this email
    SELECT id INTO admin_user_id FROM auth.users WHERE email = admin_email;
    
    IF admin_user_id IS NOT NULL THEN
      -- Check if user has admin role directly
      SELECT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = admin_user_id AND role = 'admin'
      ) INTO has_admin;
      
      RAISE NOTICE 'Admin check for %: user_id=%, has_admin=%', 
        admin_email, admin_user_id, has_admin;
    ELSE
      RAISE NOTICE 'User not found: %', admin_email;
    END IF;
  END LOOP;
END $$;
