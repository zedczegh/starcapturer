import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type TimePeriod = 'day' | 'month' | 'year';

export interface TimeAggregatedStats {
  period_label: string;
  period_start: string;
  avg_siqs: number;
  min_siqs: number;
  max_siqs: number;
  calculation_count: number;
  unique_locations: number;
  source: string;
}

export interface GroupedTimeStats {
  period_label: string;
  period_start: string;
  total_calculations: number;
  unique_locations: number;
  overall_avg_siqs: number;
  overall_min_siqs: number;
  overall_max_siqs: number;
  by_source: {
    source: string;
    avg_siqs: number;
    calculation_count: number;
  }[];
}

export const useSiqsTimeStats = (initialPeriod: TimePeriod = 'month') => {
  const [period, setPeriod] = useState<TimePeriod>(initialPeriod);
  const [rawStats, setRawStats] = useState<TimeAggregatedStats[]>([]);
  const [groupedStats, setGroupedStats] = useState<GroupedTimeStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .rpc('get_siqs_time_aggregated_stats', {
          p_period: period,
          p_source: null,
          p_limit: 100
        });

      if (fetchError) throw fetchError;

      const stats = (data || []) as TimeAggregatedStats[];
      setRawStats(stats);

      // Group stats by period
      const grouped = stats.reduce((acc, stat) => {
        const existing = acc.find(g => g.period_label === stat.period_label);
        
        if (existing) {
          existing.total_calculations += stat.calculation_count;
          existing.unique_locations += stat.unique_locations;
          existing.by_source.push({
            source: stat.source,
            avg_siqs: stat.avg_siqs,
            calculation_count: stat.calculation_count
          });
          // Recalculate overall stats
          const totalCalcs = existing.by_source.reduce((sum, s) => sum + s.calculation_count, 0);
          existing.overall_avg_siqs = existing.by_source.reduce((sum, s) => 
            sum + (s.avg_siqs * s.calculation_count), 0) / totalCalcs;
          existing.overall_min_siqs = Math.min(existing.overall_min_siqs, stat.min_siqs);
          existing.overall_max_siqs = Math.max(existing.overall_max_siqs, stat.max_siqs);
        } else {
          acc.push({
            period_label: stat.period_label,
            period_start: stat.period_start,
            total_calculations: stat.calculation_count,
            unique_locations: stat.unique_locations,
            overall_avg_siqs: stat.avg_siqs,
            overall_min_siqs: stat.min_siqs,
            overall_max_siqs: stat.max_siqs,
            by_source: [{
              source: stat.source,
              avg_siqs: stat.avg_siqs,
              calculation_count: stat.calculation_count
            }]
          });
        }
        return acc;
      }, [] as GroupedTimeStats[]);

      // Sort by period descending
      grouped.sort((a, b) => new Date(b.period_start).getTime() - new Date(a.period_start).getTime());
      setGroupedStats(grouped);
    } catch (err) {
      console.error('Error fetching time stats:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const summary = {
    totalPeriods: groupedStats.length,
    totalCalculations: groupedStats.reduce((sum, g) => sum + g.total_calculations, 0),
    overallAvgSiqs: groupedStats.length > 0 
      ? groupedStats.reduce((sum, g) => sum + g.overall_avg_siqs * g.total_calculations, 0) / 
        groupedStats.reduce((sum, g) => sum + g.total_calculations, 0)
      : 0
  };

  return {
    period,
    setPeriod,
    rawStats,
    groupedStats,
    summary,
    loading,
    error,
    refetch: fetchStats
  };
};
