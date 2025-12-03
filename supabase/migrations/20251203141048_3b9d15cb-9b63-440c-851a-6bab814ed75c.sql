-- Create function to get SIQS statistics aggregated by time period
CREATE OR REPLACE FUNCTION public.get_siqs_time_aggregated_stats(
  p_period text DEFAULT 'month', -- 'day', 'month', 'year'
  p_source text DEFAULT NULL,
  p_limit integer DEFAULT 100
)
RETURNS TABLE(
  period_label text,
  period_start timestamp with time zone,
  avg_siqs double precision,
  min_siqs double precision,
  max_siqs double precision,
  calculation_count bigint,
  unique_locations bigint,
  source text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    CASE p_period
      WHEN 'day' THEN to_char(date_trunc('day', calculated_at), 'YYYY-MM-DD')
      WHEN 'month' THEN to_char(date_trunc('month', calculated_at), 'YYYY-MM')
      WHEN 'year' THEN to_char(date_trunc('year', calculated_at), 'YYYY')
      ELSE to_char(date_trunc('month', calculated_at), 'YYYY-MM')
    END as period_label,
    date_trunc(
      CASE p_period
        WHEN 'day' THEN 'day'
        WHEN 'month' THEN 'month'
        WHEN 'year' THEN 'year'
        ELSE 'month'
      END,
      calculated_at
    ) as period_start,
    ROUND(CAST(AVG(siqs_score) AS numeric), 2)::DOUBLE PRECISION as avg_siqs,
    ROUND(CAST(MIN(siqs_score) AS numeric), 2)::DOUBLE PRECISION as min_siqs,
    ROUND(CAST(MAX(siqs_score) AS numeric), 2)::DOUBLE PRECISION as max_siqs,
    COUNT(*) as calculation_count,
    COUNT(DISTINCT CONCAT(ROUND(CAST(latitude AS numeric), 4), ',', ROUND(CAST(longitude AS numeric), 4))) as unique_locations,
    COALESCE(siqs_calculation_entries.source, 'unknown') as source
  FROM public.siqs_calculation_entries
  WHERE siqs_score IS NOT NULL
    AND calculated_at IS NOT NULL
    AND (p_source IS NULL OR siqs_calculation_entries.source = p_source)
  GROUP BY 
    CASE p_period
      WHEN 'day' THEN to_char(date_trunc('day', calculated_at), 'YYYY-MM-DD')
      WHEN 'month' THEN to_char(date_trunc('month', calculated_at), 'YYYY-MM')
      WHEN 'year' THEN to_char(date_trunc('year', calculated_at), 'YYYY')
      ELSE to_char(date_trunc('month', calculated_at), 'YYYY-MM')
    END,
    date_trunc(
      CASE p_period
        WHEN 'day' THEN 'day'
        WHEN 'month' THEN 'month'
        WHEN 'year' THEN 'year'
        ELSE 'month'
      END,
      calculated_at
    ),
    siqs_calculation_entries.source
  ORDER BY period_start DESC
  LIMIT p_limit;
$$;