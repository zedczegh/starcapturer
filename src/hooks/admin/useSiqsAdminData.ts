import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AggregatedLocation {
  location_name: string;
  latitude: number;
  longitude: number;
  avg_siqs: number;
  min_siqs?: number;
  max_siqs?: number;
  calculation_count: number;
  last_calculated_at: string;
  source: 'calculator' | 'photopoint' | 'community' | 'search';
  spot_id?: string;
}

export const useSiqsAdminData = () => {
  const [photopointLocations, setPhotopointLocations] = useState<AggregatedLocation[]>([]);
  const [communityLocations, setCommunityLocations] = useState<AggregatedLocation[]>([]);
  const [topRankedLocations, setTopRankedLocations] = useState<AggregatedLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAggregatedData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch photopoint locations (stored as 'search' in database)
      const { data: photopointData, error: photopointError } = await supabase
        .rpc('get_aggregated_siqs_locations', { 
          p_source: 'search',
          p_limit: 100
        });

      if (photopointError) throw photopointError;

      // Fetch community locations
      const { data: communityData, error: communityError } = await supabase
        .rpc('get_aggregated_siqs_locations', { 
          p_source: 'community',
          p_limit: 100
        });

      if (communityError) throw communityError;

      // Fetch top ranked locations globally
      const { data: rankedData, error: rankedError } = await supabase
        .rpc('get_top_ranked_siqs_locations', {
          p_min_calculations: 3,
          p_limit: 50
        });

      if (rankedError) throw rankedError;

      setPhotopointLocations((photopointData || []) as AggregatedLocation[]);
      setCommunityLocations((communityData || []) as AggregatedLocation[]);
      setTopRankedLocations((rankedData || []) as AggregatedLocation[]);
    } catch (err) {
      console.error('Error fetching SIQS admin data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAggregatedData();
  }, []);

  return {
    photopointLocations,
    communityLocations,
    topRankedLocations,
    loading,
    error,
    refetch: fetchAggregatedData
  };
};
