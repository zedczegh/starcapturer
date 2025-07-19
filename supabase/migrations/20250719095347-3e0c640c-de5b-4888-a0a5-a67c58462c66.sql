-- Add the specified users as administrators
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users 
WHERE email IN ('yanzeyucq@163.com', 'yanzeyu886@gmail.com')
ON CONFLICT (user_id, role) DO NOTHING;