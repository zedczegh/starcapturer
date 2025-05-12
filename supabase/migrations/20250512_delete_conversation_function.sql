
-- Function to delete all messages between two users
CREATE OR REPLACE FUNCTION public.delete_conversation(
  partner_id UUID,
  current_user_id UUID
) 
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Delete all messages between the current user and the partner
  DELETE FROM public.user_messages
  WHERE (sender_id = current_user_id AND receiver_id = partner_id)
     OR (sender_id = partner_id AND receiver_id = current_user_id);
END;
$$;
