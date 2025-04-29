
import { useState, useEffect, useCallback } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { generateForecastSpots } from '@/services/forecastSpotsService';
import { filterLocations } from '@/components/photoPoints/map/MapUtils';

interface UseForecastSpotsProps {
  userLocation: { latitude: number; longitude: number } | null;
  searchRadius: number;
  forecastDay: number;
  enabled: boolean;
}

export const useForecastSpots = ({
  userLocation,
  searchRadius,
  forecastDay,
  enabled
}: UseForecastSpotsProps) => {
  const [forecastSpots, setForecastSpots] = useState<SharedAstroSpot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Function to fetch forecast spots
  const fetchForecastSpots = useCallback(async () => {
    if (!enabled || !userLocation || searchRadius <= 0) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Generate forecast spots
      const spots = await generateForecastSpots(
        userLocation.latitude,
        userLocation.longitude,
        searchRadius,
        forecastDay,
        15 // Limit to 15 spots
      );
      
      // Store in state
      setForecastSpots(spots);
    } catch (err) {
      console.error("Error generating forecast spots:", err);
      setError("Failed to generate forecast spots");
      setForecastSpots([]);
    } finally {
      setLoading(false);
    }
  }, [userLocation, searchRadius, forecastDay, enabled]);
  
  // Fetch forecast spots when dependencies change
  useEffect(() => {
    if (enabled && userLocation) {
      fetchForecastSpots();
    }
  }, [fetchForecastSpots, enabled, userLocation, forecastDay, searchRadius]);
  
  // Clear forecast spots when disabled
  useEffect(() => {
    if (!enabled) {
      setForecastSpots([]);
    }
  }, [enabled]);
  
  return {
    forecastSpots,
    loading,
    error,
    refreshForecastSpots: fetchForecastSpots
  };
};

export default useForecastSpots;
