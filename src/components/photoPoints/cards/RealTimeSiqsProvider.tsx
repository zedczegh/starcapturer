
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
  const [isInitialFetch, setIsInitialFetch] = useState(true);
  const [fetchAttempted, setFetchAttempted] = useState(false);
  
  // Use shorter cache duration for certified locations and force refresh more aggressively
  const REFRESH_INTERVAL = isCertified ? 30 * 1000 : 5 * 60 * 1000; // 30 seconds for certified, 5 min for others
  
  // Extract any existing SIQS value for fallback
  const existingSiqsNumber = typeof existingSiqs === 'number' ? existingSiqs : 
    (typeof existingSiqs === 'object' && existingSiqs && 'score' in existingSiqs) ? existingSiqs.score : 0;
  
  // Immediately signal loading state for certified locations to avoid flickering
  useEffect(() => {
    if (isInitialFetch && isCertified && isVisible) {
      // Tell the parent we're loading immediately to avoid showing default score
      onSiqsCalculated(null, true);
      setIsInitialFetch(false);
    }
  }, [isInitialFetch, isCertified, isVisible, onSiqsCalculated]);
  
  // Memoize the fetch function to prevent unnecessary re-renders
  const fetchSiqs = useCallback(async () => {
    if (!latitude || !longitude) return;
    
    try {
      setLoading(true);
      setFetchAttempted(true);
      onSiqsCalculated(null, true);
      
      console.log(`Fetching SIQS for ${isCertified ? 'certified' : 'regular'} location at ${latitude}, ${longitude}`);
      
      // Use our unified SIQS display function
      const result = await getCompleteSiqsDisplay({
        latitude,
        longitude,
        bortleScale,
        isCertified,
        isDarkSkyReserve,
        existingSiqs: existingSiqsNumber
      });
      
      console.log(`SIQS result for ${latitude}, ${longitude}: ${result.siqs} (${result.source})`);
      onSiqsCalculated(result.siqs, false, result.source === 'realtime' ? 9 : 7);
      setLastFetchTimestamp(Date.now());
      
    } catch (error) {
      console.error("Error in RealTimeSiqsProvider:", error);
      
      // For certified locations, never use default scores if real-time fails
      if (isCertified) {
        onSiqsCalculated(null, false);
      } else if (existingSiqsNumber > 0) {
        onSiqsCalculated(existingSiqsNumber, false, 6);
      } else {
        onSiqsCalculated(null, false);
      }
    } finally {
      setLoading(false);
      setIsInitialFetch(false);
    }
  }, [latitude, longitude, bortleScale, isCertified, isDarkSkyReserve, existingSiqsNumber, onSiqsCalculated]);
  
  useEffect(() => {
    if (isVisible && latitude && longitude) {
      const shouldFetch = 
          forceUpdate || 
          !fetchAttempted ||
          (Date.now() - lastFetchTimestamp > REFRESH_INTERVAL) ||
          (isCertified && !fetchAttempted); // Always fetch for certified locations on first visibility
      
      if (shouldFetch) {
        console.log(`Fetching real-time SIQS for ${isCertified ? 'certified' : 'regular'} location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        fetchSiqs();
      }
    }
  }, [isVisible, latitude, longitude, lastFetchTimestamp, fetchSiqs, forceUpdate, isCertified, REFRESH_INTERVAL, fetchAttempted]);
  
  return null; // This is a headless component
};

export default React.memo(RealTimeSiqsProvider);
