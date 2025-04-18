
import React, { useState, useEffect, useCallback } from 'react';
import { getCompleteSiqsDisplay, getDisplaySiqs } from '@/utils/unifiedSiqsDisplay';
import { getSiqsScore } from '@/utils/siqsHelpers';

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
  
  // Extract any existing SIQS value for fallback
  const existingSiqsNumber = getSiqsScore(existingSiqs);
  
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
        existingSiqs: existingSiqsNumber
      });
      
      onSiqsCalculated(result.siqs, false, result.source === 'realtime' ? 9 : 7);
      setLastFetchTimestamp(Date.now());
      
    } catch (error) {
      console.error("Error in RealTimeSiqsProvider:", error);
      
      // Fallback to default SIQS display
      const defaultSiqs = getDisplaySiqs({
        realTimeSiqs: null,
        staticSiqs: existingSiqsNumber,
        isCertified,
        isDarkSkyReserve
      });
      
      onSiqsCalculated(defaultSiqs, false);
    } finally {
      setLoading(false);
    }
  }, [latitude, longitude, bortleScale, isCertified, isDarkSkyReserve, existingSiqsNumber, onSiqsCalculated]);
  
  useEffect(() => {
    // Different fetch strategies based on location type
    const REFRESH_INTERVAL = isCertified ? 60 * 1000 : 120 * 1000; // 1 min for certified, 2 min for regular
    
    if (isVisible && latitude && longitude) {
      const shouldFetch = forceUpdate || 
                           (Date.now() - lastFetchTimestamp > REFRESH_INTERVAL);
      
      if (shouldFetch) {
        console.log(`Fetching real-time SIQS for ${isCertified ? "certified" : "regular"} location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        fetchSiqs();
      }
    }
  }, [isVisible, latitude, longitude, lastFetchTimestamp, fetchSiqs, isCertified, forceUpdate]);
  
  return null; // This is a headless component
};

export default React.memo(RealTimeSiqsProvider);
