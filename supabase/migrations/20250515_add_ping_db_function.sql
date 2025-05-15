
-- Create a simple ping_db RPC function that just returns true
-- This will be used to check if the database is responsive
CREATE OR REPLACE FUNCTION public.ping_db()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN jsonb_build_object('status', 'ok', 'timestamp', EXTRACT(EPOCH FROM NOW()));
END;
$$;
