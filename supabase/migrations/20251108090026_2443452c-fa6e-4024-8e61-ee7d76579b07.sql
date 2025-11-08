
-- Add admin role for 13985567968@163.com
INSERT INTO public.user_roles (user_id, role)
VALUES ('ee232fa7-3f87-4f07-8d7f-213eeaf6c0da', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Verify all 3 admins are set
SELECT ur.user_id, ur.role, au.email
FROM public.user_roles ur
JOIN auth.users au ON au.id = ur.user_id
WHERE au.email IN ('yanzeyucq@163.com', '13985567968@163.com', '17708516715@163.com')
  AND ur.role = 'admin'
ORDER BY au.email;
