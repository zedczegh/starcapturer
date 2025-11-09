-- Fix RLS policies for siqs_calculation_entries to allow public access
-- This is needed because SIQS calculations can happen for anonymous users

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public insert" ON public.siqs_calculation_entries;
DROP POLICY IF EXISTS "Allow public read" ON public.siqs_calculation_entries;
DROP POLICY IF EXISTS "Allow admin all access" ON public.siqs_calculation_entries;
DROP POLICY IF EXISTS "Allow public insert on siqs_calculation_entries" ON public.siqs_calculation_entries;
DROP POLICY IF EXISTS "Allow admin read on siqs_calculation_entries" ON public.siqs_calculation_entries;
DROP POLICY IF EXISTS "Allow users read own siqs_calculation_entries" ON public.siqs_calculation_entries;

-- Allow anyone to insert SIQS calculation data (for data gathering)
CREATE POLICY "Allow public insert on siqs_calculation_entries"
ON public.siqs_calculation_entries
FOR INSERT
TO public
WITH CHECK (true);

-- Allow admins to read all data
CREATE POLICY "Allow admin read on siqs_calculation_entries"
ON public.siqs_calculation_entries
FOR SELECT
TO authenticated
USING (public.has_role('admin'));

-- Allow users to read their own data
CREATE POLICY "Allow users read own siqs_calculation_entries"
ON public.siqs_calculation_entries
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR user_id IS NULL);