-- Recreate the function with correct bcrypt cost factor (10)
CREATE OR REPLACE FUNCTION public.admin_create_user(
  p_email TEXT,
  p_password TEXT,
  p_username TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user_id UUID;
  v_encrypted_pw TEXT;
BEGIN
  -- Generate user ID
  v_user_id := gen_random_uuid();
  
  -- Hash the password using bcrypt with cost factor 10 (same as Supabase)
  v_encrypted_pw := extensions.crypt(p_password, extensions.gen_salt('bf', 10));
  
  -- Delete existing user with same email if exists
  DELETE FROM auth.identities WHERE identity_data->>'email' = p_email;
  DELETE FROM auth.users WHERE email = p_email;
  
  -- Insert into auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_sent_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    p_email,
    v_encrypted_pw,
    NOW(),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    CASE WHEN p_username IS NOT NULL 
      THEN jsonb_build_object('username', p_username)
      ELSE '{}'::jsonb
    END,
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  );
  
  -- Insert into auth.identities with email_verified = true
  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    v_user_id,
    v_user_id::text,
    jsonb_build_object(
      'sub', v_user_id::text,
      'email', p_email,
      'email_verified', true,
      'phone_verified', false
    ),
    'email',
    NOW(),
    NOW(),
    NOW()
  );
  
  -- Create profile entry
  INSERT INTO public.profiles (id, username)
  VALUES (v_user_id, p_username)
  ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username;
  
  RETURN v_user_id;
END;
$$;