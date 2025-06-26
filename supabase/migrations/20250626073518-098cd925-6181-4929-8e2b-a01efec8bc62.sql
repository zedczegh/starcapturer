
-- Create wallet table for user balances
CREATE TABLE public.user_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, currency)
);

-- Create transactions table for payment history
CREATE TABLE public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id UUID REFERENCES public.user_wallets(id) ON DELETE SET NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'payment', 'refund', 'booking_payment', 'booking_received')),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  stripe_payment_intent_id TEXT,
  stripe_session_id TEXT,
  related_booking_id UUID,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create payment methods table
CREATE TABLE public.user_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_payment_method_id TEXT,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('card', 'paypal', 'wechat', 'alipay')),
  is_default BOOLEAN DEFAULT false,
  last_four TEXT,
  brand TEXT,
  exp_month INTEGER,
  exp_year INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_payment_methods ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_wallets
CREATE POLICY "Users can view own wallet" ON public.user_wallets
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Service can manage wallets" ON public.user_wallets
  FOR ALL USING (true);

-- RLS policies for wallet_transactions
CREATE POLICY "Users can view own transactions" ON public.wallet_transactions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Service can manage transactions" ON public.wallet_transactions
  FOR ALL USING (true);

-- RLS policies for user_payment_methods
CREATE POLICY "Users can view own payment methods" ON public.user_payment_methods
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own payment methods" ON public.user_payment_methods
  FOR ALL USING (user_id = auth.uid());

-- Add indexes for better performance
CREATE INDEX idx_user_wallets_user_id ON public.user_wallets(user_id);
CREATE INDEX idx_wallet_transactions_user_id ON public.wallet_transactions(user_id);
CREATE INDEX idx_wallet_transactions_status ON public.wallet_transactions(status);
CREATE INDEX idx_user_payment_methods_user_id ON public.user_payment_methods(user_id);

-- Function to get or create user wallet
CREATE OR REPLACE FUNCTION public.get_or_create_wallet(p_user_id UUID, p_currency TEXT DEFAULT 'USD')
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Function to update wallet balance
CREATE OR REPLACE FUNCTION public.update_wallet_balance(
  p_user_id UUID,
  p_amount DECIMAL(10,2),
  p_transaction_type TEXT,
  p_currency TEXT DEFAULT 'USD',
  p_description TEXT DEFAULT NULL,
  p_related_booking_id UUID DEFAULT NULL,
  p_stripe_payment_intent_id TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_wallet_id UUID;
  v_transaction_id UUID;
  v_current_balance DECIMAL(10,2);
BEGIN
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
$$;
