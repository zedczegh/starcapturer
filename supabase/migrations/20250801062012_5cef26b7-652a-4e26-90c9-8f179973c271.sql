-- Phase 1: Enable RLS on critical tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.astro_spot_comments ENABLE ROW LEVEL SECURITY;

-- Phase 2: Strengthen user_roles table security
CREATE POLICY "Only admins can insert roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (has_role('admin'));

CREATE POLICY "Only admins can update roles" 
ON public.user_roles 
FOR UPDATE 
USING (has_role('admin'));

-- Phase 5: Secure database functions with proper search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_spot_verification_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- When application status changes to approved or rejected, update the spot
  IF NEW.status = 'approved' THEN
    UPDATE public.user_astro_spots 
    SET verification_status = 'verified'
    WHERE id = NEW.spot_id;
  ELSIF NEW.status = 'rejected' THEN
    UPDATE public.user_astro_spots 
    SET verification_status = 'rejected'
    WHERE id = NEW.spot_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_admins_verification_application()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  spot_record RECORD;
BEGIN
  -- Get spot information
  SELECT name, user_id INTO spot_record
  FROM public.user_astro_spots 
  WHERE id = NEW.spot_id;
  
  -- Create notification for admins about new verification application
  INSERT INTO public.admin_notifications (
    notification_type,
    title,
    message,
    link_url,
    related_spot_id,
    related_application_id,
    metadata
  ) VALUES (
    'verification_application',
    'New Verification Application',
    'A new verification application has been submitted for astrospot: ' || spot_record.name,
    '/astro-spot/' || NEW.spot_id,
    NEW.spot_id,
    NEW.id,
    jsonb_build_object(
      'applicant_id', NEW.applicant_id,
      'spot_name', spot_record.name,
      'application_status', NEW.status
    )
  );
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_or_create_wallet(p_user_id uuid, p_currency text DEFAULT 'USD'::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_wallet_id UUID;
BEGIN
  -- Try to get existing wallet
  SELECT id INTO v_wallet_id
  FROM public.user_wallets
  WHERE user_id = p_user_id AND currency = p_currency;
  
  -- Create wallet if it doesn't exist
  IF v_wallet_id IS NULL THEN
    INSERT INTO public.user_wallets (user_id, currency, balance)
    VALUES (p_user_id, p_currency, 0.00)
    RETURNING id INTO v_wallet_id;
  END IF;
  
  RETURN v_wallet_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_wallet_balance(p_user_id uuid, p_amount numeric, p_transaction_type text, p_currency text DEFAULT 'USD'::text, p_description text DEFAULT NULL::text, p_related_booking_id uuid DEFAULT NULL::uuid, p_stripe_payment_intent_id text DEFAULT NULL::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_wallet_id UUID;
  v_transaction_id UUID;
  v_current_balance DECIMAL(10,2);
BEGIN
  -- Validate input amount
  IF p_amount IS NULL OR p_amount = 0 THEN
    RAISE EXCEPTION 'Invalid transaction amount';
  END IF;
  
  -- Validate transaction type
  IF p_transaction_type NOT IN ('topup', 'withdrawal', 'payment', 'booking_payment', 'refund') THEN
    RAISE EXCEPTION 'Invalid transaction type';
  END IF;
  
  -- Get or create wallet
  v_wallet_id := public.get_or_create_wallet(p_user_id, p_currency);
  
  -- Get current balance
  SELECT balance INTO v_current_balance
  FROM public.user_wallets
  WHERE id = v_wallet_id;
  
  -- Check if withdrawal amount exceeds balance
  IF p_transaction_type IN ('withdrawal', 'payment', 'booking_payment') AND v_current_balance < ABS(p_amount) THEN
    RAISE EXCEPTION 'Insufficient wallet balance';
  END IF;
  
  -- Update wallet balance
  UPDATE public.user_wallets
  SET 
    balance = balance + p_amount,
    updated_at = now()
  WHERE id = v_wallet_id;
  
  -- Create transaction record
  INSERT INTO public.wallet_transactions (
    user_id,
    wallet_id,
    transaction_type,
    amount,
    currency,
    status,
    stripe_payment_intent_id,
    related_booking_id,
    description
  ) VALUES (
    p_user_id,
    v_wallet_id,
    p_transaction_type,
    p_amount,
    p_currency,
    'completed',
    p_stripe_payment_intent_id,
    p_related_booking_id,
    p_description
  )
  RETURNING id INTO v_transaction_id;
  
  RETURN v_transaction_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.has_role(required_role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = required_role
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_spot_type_color(type_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  CASE type_name
    WHEN 'National/Academic Observatory' THEN
      RETURN '#9b87f5';
    WHEN 'Personal Observatory' THEN
      RETURN '#0EA5E9';
    WHEN 'Personal Favorite Observation Point' THEN
      RETURN '#4ADE80';
    WHEN 'Favored Observation Point of local hobby groups' THEN
      RETURN '#FFD700';
    WHEN 'Star Party venue' THEN
      RETURN '#FFFF00';
    WHEN 'Regular Camping Site' THEN
      RETURN '#808000';
    WHEN 'Astro Lodging' THEN
      RETURN '#FF69B4';
    ELSE
      RETURN '#4ADE80';
  END CASE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.delete_conversation(partner_id uuid, current_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Delete all messages between the current user and the partner
  DELETE FROM public.user_messages
  WHERE (sender_id = current_user_id AND receiver_id = partner_id)
     OR (sender_id = partner_id AND receiver_id = current_user_id);
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_username_available(username_to_check text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE username = username_to_check
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.insert_astro_spot_reservation(p_timeslot_id uuid, p_user_id uuid, p_status text DEFAULT 'confirmed'::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_id UUID;
  v_capacity INTEGER;
  v_current_bookings INTEGER;
BEGIN
  -- Validate inputs
  IF p_timeslot_id IS NULL OR p_user_id IS NULL THEN
    RAISE EXCEPTION 'Invalid input parameters';
  END IF;
  
  -- Check capacity
  SELECT max_capacity INTO v_capacity
  FROM public.astro_spot_timeslots
  WHERE id = p_timeslot_id;
  
  IF v_capacity IS NULL THEN
    RAISE EXCEPTION 'Timeslot not found';
  END IF;
  
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
$function$;

CREATE OR REPLACE FUNCTION public.insert_astro_spot_timeslot(p_spot_id uuid, p_creator_id uuid, p_start_time timestamp with time zone, p_end_time timestamp with time zone, p_max_capacity integer DEFAULT 1, p_description text DEFAULT NULL::text, p_price numeric DEFAULT 0, p_currency text DEFAULT '$'::text, p_pets_policy text DEFAULT 'not_allowed'::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_id UUID;
BEGIN
  -- Validate inputs
  IF p_spot_id IS NULL OR p_creator_id IS NULL OR p_start_time IS NULL OR p_end_time IS NULL THEN
    RAISE EXCEPTION 'Invalid input parameters';
  END IF;
  
  IF p_start_time >= p_end_time THEN
    RAISE EXCEPTION 'Start time must be before end time';
  END IF;
  
  IF p_max_capacity < 1 THEN
    RAISE EXCEPTION 'Capacity must be at least 1';
  END IF;
  
  IF p_price < 0 THEN
    RAISE EXCEPTION 'Price cannot be negative';
  END IF;
  
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
$function$;

CREATE OR REPLACE FUNCTION public.update_astro_spot_timeslot(p_id uuid, p_spot_id uuid, p_creator_id uuid, p_start_time timestamp with time zone, p_end_time timestamp with time zone, p_max_capacity integer DEFAULT 1, p_description text DEFAULT NULL::text, p_price numeric DEFAULT 0, p_currency text DEFAULT '$'::text, p_pets_policy text DEFAULT 'not_allowed'::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Validate inputs
  IF p_id IS NULL OR p_spot_id IS NULL OR p_creator_id IS NULL OR p_start_time IS NULL OR p_end_time IS NULL THEN
    RAISE EXCEPTION 'Invalid input parameters';
  END IF;
  
  IF p_start_time >= p_end_time THEN
    RAISE EXCEPTION 'Start time must be before end time';
  END IF;
  
  IF p_max_capacity < 1 THEN
    RAISE EXCEPTION 'Capacity must be at least 1';
  END IF;
  
  IF p_price < 0 THEN
    RAISE EXCEPTION 'Price cannot be negative';
  END IF;
  
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
$function$;