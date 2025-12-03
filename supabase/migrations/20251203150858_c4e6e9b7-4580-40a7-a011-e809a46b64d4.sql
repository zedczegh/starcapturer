-- Fix RLS policies on astro_spot_timeslots to use subquery for auth.uid()
DROP POLICY IF EXISTS "Creators can delete their timeslots" ON public.astro_spot_timeslots;
DROP POLICY IF EXISTS "Creators can insert timeslots" ON public.astro_spot_timeslots;
DROP POLICY IF EXISTS "Creators can update their timeslots" ON public.astro_spot_timeslots;

-- Recreate with optimized auth.uid() calls using subquery
CREATE POLICY "Creators can delete their timeslots" 
ON public.astro_spot_timeslots 
FOR DELETE 
USING ((select auth.uid()) = creator_id);

CREATE POLICY "Creators can insert timeslots" 
ON public.astro_spot_timeslots 
FOR INSERT 
WITH CHECK ((select auth.uid()) = creator_id);

CREATE POLICY "Creators can update their timeslots" 
ON public.astro_spot_timeslots 
FOR UPDATE 
USING ((select auth.uid()) = creator_id);