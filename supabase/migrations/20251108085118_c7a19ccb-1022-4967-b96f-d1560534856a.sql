-- Add 5 admins to the system
-- First, ensure yanzeyucq@163.com is an admin
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get user ID for yanzeyucq@163.com
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'yanzeyucq@163.com';
  
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  -- Get user ID for 17708516715@163.com (already added)
  SELECT id INTO v_user_id FROM auth.users WHERE email = '17708516715@163.com';
  
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;

-- Enhance siqs_calculation_entries table for better analytics
ALTER TABLE public.siqs_calculation_entries 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'calculator' CHECK (source IN ('calculator', 'photopoint', 'community', 'search'));

ALTER TABLE public.siqs_calculation_entries 
ADD COLUMN IF NOT EXISTS spot_id UUID REFERENCES public.user_astro_spots(id) ON DELETE SET NULL;

-- Add indexes for performance on admin queries
CREATE INDEX IF NOT EXISTS idx_siqs_calculations_location 
ON public.siqs_calculation_entries (latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_siqs_calculations_source 
ON public.siqs_calculation_entries (source);

CREATE INDEX IF NOT EXISTS idx_siqs_calculations_calculated_at 
ON public.siqs_calculation_entries (calculated_at DESC);

CREATE INDEX IF NOT EXISTS idx_siqs_calculations_spot_id 
ON public.siqs_calculation_entries (spot_id) WHERE spot_id IS NOT NULL;

-- Create a function to get aggregated SIQS data by location
CREATE OR REPLACE FUNCTION public.get_aggregated_siqs_locations(
  p_source TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  location_name TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  avg_siqs DOUBLE PRECISION,
  min_siqs DOUBLE PRECISION,
  max_siqs DOUBLE PRECISION,
  calculation_count BIGINT,
  last_calculated_at TIMESTAMP WITH TIME ZONE,
  source TEXT,
  spot_id UUID
) 
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COALESCE(location_name, 'Unknown Location') as location_name,
    ROUND(CAST(latitude AS numeric), 4)::DOUBLE PRECISION as latitude,
    ROUND(CAST(longitude AS numeric), 4)::DOUBLE PRECISION as longitude,
    ROUND(CAST(AVG(siqs_score) AS numeric), 2)::DOUBLE PRECISION as avg_siqs,
    ROUND(CAST(MIN(siqs_score) AS numeric), 2)::DOUBLE PRECISION as min_siqs,
    ROUND(CAST(MAX(siqs_score) AS numeric), 2)::DOUBLE PRECISION as max_siqs,
    COUNT(*) as calculation_count,
    MAX(calculated_at) as last_calculated_at,
    source,
    spot_id
  FROM public.siqs_calculation_entries
  WHERE (p_source IS NULL OR source = p_source)
    AND siqs_score IS NOT NULL
  GROUP BY 
    ROUND(CAST(latitude AS numeric), 4),
    ROUND(CAST(longitude AS numeric), 4),
    location_name,
    source,
    spot_id
  ORDER BY calculation_count DESC, avg_siqs DESC
  LIMIT p_limit;
$$;

-- Create function to get top ranked locations globally
CREATE OR REPLACE FUNCTION public.get_top_ranked_siqs_locations(
  p_min_calculations INTEGER DEFAULT 3,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  location_name TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  avg_siqs DOUBLE PRECISION,
  calculation_count BIGINT,
  last_calculated_at TIMESTAMP WITH TIME ZONE,
  source TEXT,
  spot_id UUID
) 
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COALESCE(location_name, 'Unknown Location') as location_name,
    ROUND(CAST(latitude AS numeric), 4)::DOUBLE PRECISION as latitude,
    ROUND(CAST(longitude AS numeric), 4)::DOUBLE PRECISION as longitude,
    ROUND(CAST(AVG(siqs_score) AS numeric), 2)::DOUBLE PRECISION as avg_siqs,
    COUNT(*) as calculation_count,
    MAX(calculated_at) as last_calculated_at,
    source,
    spot_id
  FROM public.siqs_calculation_entries
  WHERE siqs_score IS NOT NULL
  GROUP BY 
    ROUND(CAST(latitude AS numeric), 4),
    ROUND(CAST(longitude AS numeric), 4),
    location_name,
    source,
    spot_id
  HAVING COUNT(*) >= p_min_calculations
  ORDER BY avg_siqs DESC, calculation_count DESC
  LIMIT p_limit;
$$;

-- Grant execute permissions to authenticated users for the functions
GRANT EXECUTE ON FUNCTION public.get_aggregated_siqs_locations TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_ranked_siqs_locations TO authenticated;