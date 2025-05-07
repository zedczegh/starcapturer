
create or replace function is_username_available(username_to_check text)
returns boolean
language plpgsql
security definer
as $$
declare
  username_exists boolean;
begin
  -- Check if username exists in the profiles table
  select exists(
    select 1 from profiles where username = username_to_check
  ) into username_exists;

  -- Return true if username is available (doesn't exist), false otherwise
  return not username_exists;
end;
$$;
