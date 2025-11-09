
-- Drop the admin_users view as it's causing type conflicts
-- We'll use the list_admins() function instead
DROP VIEW IF EXISTS public.admin_users;
