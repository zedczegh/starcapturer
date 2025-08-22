-- Tighten RLS policies to fix security findings

-- 1) Restrict user_wallets service policy to service_role only
DROP POLICY IF EXISTS "Service can manage wallets" ON public.user_wallets;
CREATE POLICY "Service can manage wallets"
ON public.user_wallets
AS PERMISSIVE
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Ensure users can only view their own wallet (keep/select policy explicit)
DROP POLICY IF EXISTS "Users can view own wallet" ON public.user_wallets;
CREATE POLICY "Users can view own wallet"
ON public.user_wallets
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 2) Restrict wallet_transactions service policy to service_role only
DROP POLICY IF EXISTS "Service can manage transactions" ON public.wallet_transactions;
CREATE POLICY "Service can manage transactions"
ON public.wallet_transactions
AS PERMISSIVE
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Ensure users can only view their own transactions (explicit to authenticated)
DROP POLICY IF EXISTS "Users can view own transactions" ON public.wallet_transactions;
CREATE POLICY "Users can view own transactions"
ON public.wallet_transactions
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 3) Restrict public read of astro_spot_reservations to owner or host
DROP POLICY IF EXISTS "Anyone can view reservations" ON public.astro_spot_reservations;
CREATE POLICY "Users and hosts can view reservations"
ON public.astro_spot_reservations
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  -- reservation owner
  auth.uid() = user_id
  OR
  -- host who owns the timeslot
  EXISTS (
    SELECT 1
    FROM public.astro_spot_timeslots t
    WHERE t.id = astro_spot_reservations.timeslot_id
      AND t.creator_id = auth.uid()
  )
);

-- Keep existing INSERT/UPDATE/DELETE policies for reservation owner intact
