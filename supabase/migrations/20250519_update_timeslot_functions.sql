
-- Update the insert_astro_spot_timeslot function to add the pets_policy parameter
CREATE OR REPLACE FUNCTION public.insert_astro_spot_timeslot(
  p_spot_id UUID,
  p_creator_id UUID,
  p_start_time TIMESTAMP WITH TIME ZONE,
  p_end_time TIMESTAMP WITH TIME ZONE,
  p_max_capacity INTEGER DEFAULT 1,
  p_description TEXT DEFAULT NULL,
  p_price NUMERIC DEFAULT 0,
  p_currency TEXT DEFAULT '$',
  p_pets_policy TEXT DEFAULT 'not_allowed'
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.astro_spot_timeslots (
    spot_id, 
    creator_id,
    start_time,
    end_time,
    max_capacity,
    description,
    price,
    currency,
    pets_policy
  ) VALUES (
    p_spot_id,
    p_creator_id,
    p_start_time,
    p_end_time,
    p_max_capacity,
    p_description,
    p_price,
    p_currency,
    p_pets_policy
  )
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;

-- Update the update_astro_spot_timeslot function to add the pets_policy parameter
CREATE OR REPLACE FUNCTION public.update_astro_spot_timeslot(
  p_id UUID,
  p_spot_id UUID,
  p_creator_id UUID,
  p_start_time TIMESTAMP WITH TIME ZONE,
  p_end_time TIMESTAMP WITH TIME ZONE,
  p_max_capacity INTEGER DEFAULT 1,
  p_description TEXT DEFAULT NULL,
  p_price NUMERIC DEFAULT 0,
  p_currency TEXT DEFAULT '$',
  p_pets_policy TEXT DEFAULT 'not_allowed'
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.astro_spot_timeslots
  SET 
    start_time = p_start_time,
    end_time = p_end_time,
    max_capacity = p_max_capacity,
    description = p_description,
    price = p_price,
    currency = p_currency,
    pets_policy = p_pets_policy,
    updated_at = NOW()
  WHERE 
    id = p_id
    AND spot_id = p_spot_id
    AND creator_id = p_creator_id;
    
  RETURN FOUND;
END;
$$;
