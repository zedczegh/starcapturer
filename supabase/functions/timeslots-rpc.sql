
-- This file contains the SQL functions that should be added to Supabase
-- to support the timeslot and reservation features.

-- Function to insert a time slot
CREATE OR REPLACE FUNCTION public.insert_astro_spot_timeslot(
  p_spot_id UUID,
  p_creator_id UUID,
  p_start_time TIMESTAMP WITH TIME ZONE,
  p_end_time TIMESTAMP WITH TIME ZONE,
  p_max_capacity INTEGER DEFAULT 1,
  p_description TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
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
    description
  ) VALUES (
    p_spot_id,
    p_creator_id,
    p_start_time,
    p_end_time,
    p_max_capacity,
    p_description
  )
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;

-- Function to update a time slot
CREATE OR REPLACE FUNCTION public.update_astro_spot_timeslot(
  p_id UUID,
  p_spot_id UUID,
  p_creator_id UUID,
  p_start_time TIMESTAMP WITH TIME ZONE,
  p_end_time TIMESTAMP WITH TIME ZONE,
  p_max_capacity INTEGER DEFAULT 1,
  p_description TEXT DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.astro_spot_timeslots
  SET 
    start_time = p_start_time,
    end_time = p_end_time,
    max_capacity = p_max_capacity,
    description = p_description,
    updated_at = NOW()
  WHERE 
    id = p_id
    AND spot_id = p_spot_id
    AND creator_id = p_creator_id;
    
  RETURN FOUND;
END;
$$;

-- Function to insert a reservation
CREATE OR REPLACE FUNCTION public.insert_astro_spot_reservation(
  p_timeslot_id UUID,
  p_user_id UUID,
  p_status TEXT DEFAULT 'confirmed'
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
  v_capacity INTEGER;
  v_current_bookings INTEGER;
BEGIN
  -- Check capacity
  SELECT max_capacity INTO v_capacity
  FROM public.astro_spot_timeslots
  WHERE id = p_timeslot_id;
  
  SELECT COUNT(*) INTO v_current_bookings
  FROM public.astro_spot_reservations
  WHERE timeslot_id = p_timeslot_id AND status = 'confirmed';
  
  IF v_current_bookings >= v_capacity THEN
    RAISE EXCEPTION 'Time slot is fully booked';
  END IF;
  
  INSERT INTO public.astro_spot_reservations (
    timeslot_id,
    user_id,
    status
  ) VALUES (
    p_timeslot_id,
    p_user_id,
    p_status
  )
  RETURNING id INTO v_id;
  
  RETURN v_id;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'You have already booked this time slot';
END;
$$;
