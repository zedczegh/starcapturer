-- Update can_use_utility function to default to false (utilities off by default)
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
  -- Check if user account is active
  SELECT COALESCE(is_active, true) INTO v_is_active
  FROM public.user_account_status
  WHERE user_id = p_user_id;
  
  -- If account is deactivated, deny access
  IF v_is_active IS FALSE THEN
    RETURN false;
  END IF;
  
  -- Check utility permission - default to FALSE (off) if no record exists
  SELECT COALESCE(is_enabled, false) INTO v_utility_enabled
  FROM public.user_utility_permissions
  WHERE user_id = p_user_id AND utility_key = p_utility_key;
  
  -- Return false by default if no permission record exists
  RETURN COALESCE(v_utility_enabled, false);
END;
$$;