
import React, { useState, useEffect, useCallback } from 'react';
import { getCompleteSiqsDisplay } from '@/utils/unifiedSiqsDisplay';

interface RealTimeSiqsProviderProps {
  isVisible: boolean;
  latitude?: number;
  longitude?: number;
  bortleScale?: number;
  isCertified?: boolean;
  isDarkSkyReserve?: boolean;
  existingSiqs?: number | any;
  onSiqsCalculated: (siqs: number | null, loading: boolean, confidence?: number) => void;
  forceUpdate?: boolean;
}

const RealTimeSiqsProvider: React.FC<RealTimeSiqsProviderProps> = ({
  isVisible,
  latitude,
  longitude,
  bortleScale = 4,
  isCertified = false,
  isDarkSkyReserve = false,
  existingSiqs,
  onSiqsCalculated,
  forceUpdate = false
}) => {
  const [loading, setLoading] = useState(false);
  const [lastFetchTimestamp, setLastFetchTimestamp] = useState<number>(0);
  
  // Use consistent cache duration for all locations
  const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes for all locations
  
  // Extract any existing SIQS value for fallback
  const existingSiqsNumber = typeof existingSiqs === 'number' ? existingSiqs : 
    (typeof existingSiqs === 'object' && existingSiqs && 'score' in existingSiqs) ? existingSiqs.score : 0;
  
  // Normalize SIQS to 1-10 scale if needed
  const normalizedSiqs = existingSiqsNumber > 10 ? existingSiqsNumber / 10 : existingSiqsNumber;
  
  // Memoize the fetch function to prevent unnecessary re-renders
  const fetchSiqs = useCallback(async () => {
    if (!latitude || !longitude) return;
    
    try {
      setLoading(true);
      onSiqsCalculated(null, true);
      
      // Use our unified SIQS display function
      const result = await getCompleteSiqsDisplay({
        latitude,
        longitude,
        bortleScale,
        isCertified,
        isDarkSkyReserve,
        existingSiqs: normalizedSiqs
      });
      
      // Ensure result is normalized to 1-10 scale
      const normalizedResult = result.siqs > 10 ? result.siqs / 10 : result.siqs;
      
      onSiqsCalculated(normalizedResult, false, result.source === 'realtime' ? 9 : 7);
      setLastFetchTimestamp(Date.now());
      
    } catch (error) {
      console.error("Error in RealTimeSiqsProvider:", error);
      
      if (normalizedSiqs > 0) {
        onSiqsCalculated(normalizedSiqs, false, 6);
      } else {
        onSiqsCalculated(null, false);
      }
    } finally {
      setLoading(false);
    }
  }, [latitude, longitude, bortleScale, isCertified, isDarkSkyReserve, normalizedSiqs, onSiqsCalculated]);
  
  useEffect(() => {
    if (isVisible && latitude && longitude) {
      const shouldFetch = forceUpdate || 
                          (Date.now() - lastFetchTimestamp > REFRESH_INTERVAL);
      
      if (shouldFetch) {
        console.log(`Fetching real-time SIQS for location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}, isCertified: ${isCertified}`);
        fetchSiqs();
      }
    }
  }, [isVisible, latitude, longitude, lastFetchTimestamp, fetchSiqs, forceUpdate, isCertified]);
  
  return null; // This is a headless component
};

export default React.memo(RealTimeSiqsProvider);
