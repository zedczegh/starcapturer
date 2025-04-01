
import { useEffect, useState, useCallback } from 'react';
import { fetchLightPollutionData } from '@/lib/api/pollution';
import { estimateBortleScaleByLocation } from '@/utils/locationUtils';

interface UseLightPollutionDataProps {
  latitude: number;
  longitude: number;
  locationName?: string;
  initialBortleScale?: number | null;
  onBortleScaleChange?: (bortleScale: number) => void;
  forceRefresh?: boolean;
}

export const useLightPollutionData = ({
  latitude,
  longitude,
  locationName,
  initialBortleScale,
  onBortleScaleChange,
  forceRefresh = false
}: UseLightPollutionDataProps) => {
  const [bortleScale, setBortleScale] = useState<number | null>(initialBortleScale || null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Update cache key when location changes
  const cacheKey = `light-pollution-${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
  
  // Function to fetch light pollution data
  const fetchData = useCallback(async () => {
    if (!latitude || !longitude || !isFinite(latitude) || !isFinite(longitude)) {
      return;
    }

    // Check if we already have cached data for this location
    const cachedData = sessionStorage.getItem(cacheKey);
    if (cachedData && !forceRefresh) {
      try {
        const { bortleScale: cachedBortleScale, timestamp } = JSON.parse(cachedData);
        
        // Check if cache is fresh (less than 1 hour old)
        const cacheAge = Date.now() - timestamp;
        if (cachedBortleScale && cacheAge < 60 * 60 * 1000) { // 1 hour
          console.log(`Using cached light pollution data for ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          setBortleScale(cachedBortleScale);
          setLastUpdated(new Date(timestamp));
          
          // Notify parent component if needed
          if (onBortleScaleChange && cachedBortleScale !== bortleScale) {
            onBortleScaleChange(cachedBortleScale);
          }
          
          return;
        }
      } catch (e) {
        console.error("Error parsing cached light pollution data:", e);
        // Continue to fetch fresh data if cache parsing fails
      }
    }

    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching light pollution data for ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      const pollutionData = await fetchLightPollutionData(latitude, longitude);
      
      let newBortleScale: number;
      
      if (pollutionData?.bortleScale && pollutionData.bortleScale > 0 && pollutionData.bortleScale <= 9) {
        // Use API-provided value if valid
        newBortleScale = pollutionData.bortleScale;
        console.log(`Light pollution API returned Bortle scale: ${newBortleScale}`);
      } else {
        // Fallback to estimation based on location
        newBortleScale = estimateBortleScaleByLocation(
          locationName || '', 
          latitude, 
          longitude
        );
        console.log(`Estimated Bortle scale from location: ${newBortleScale}`);
      }
      
      // Update state
      setBortleScale(newBortleScale);
      setLastUpdated(new Date());
      
      // Cache the result
      sessionStorage.setItem(
        cacheKey, 
        JSON.stringify({ 
          bortleScale: newBortleScale, 
          timestamp: Date.now() 
        })
      );
      
      // Notify parent component
      if (onBortleScaleChange && newBortleScale !== bortleScale) {
        onBortleScaleChange(newBortleScale);
      }
      
    } catch (err) {
      console.error("Error fetching light pollution data:", err);
      setError(err instanceof Error ? err : new Error('Unknown error fetching light pollution data'));
      
      // Fallback to estimation if API fails
      if (!bortleScale) {
        const estimatedScale = estimateBortleScaleByLocation(
          locationName || '', 
          latitude, 
          longitude
        );
        
        console.log(`Fallback to estimated Bortle scale: ${estimatedScale}`);
        setBortleScale(estimatedScale);
        
        // Also cache this fallback
        sessionStorage.setItem(
          cacheKey, 
          JSON.stringify({ 
            bortleScale: estimatedScale, 
            timestamp: Date.now(),
            isEstimated: true
          })
        );
        
        // Notify parent component
        if (onBortleScaleChange && estimatedScale !== bortleScale) {
          onBortleScaleChange(estimatedScale);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [latitude, longitude, locationName, cacheKey, forceRefresh, bortleScale, onBortleScaleChange]);

  // Fetch data when component mounts or when parameters change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Force refresh function
  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    bortleScale,
    isLoading,
    error,
    lastUpdated,
    refresh
  };
};
