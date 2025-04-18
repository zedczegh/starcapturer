
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getCompleteSiqsDisplay } from '@/utils/unifiedSiqsDisplay';
import { hasCachedSiqs, getCachedSiqs } from '@/services/realTimeSiqs/siqsCache';

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
  const isMountedRef = useRef(true);
  
  // Use shorter cache duration for certified locations
  const REFRESH_INTERVAL = isCertified ? 45 * 1000 : 5 * 60 * 1000; // 45 seconds for certified, 5 min for others
  
  // Extract any existing SIQS value for fallback
  const existingSiqsNumber = typeof existingSiqs === 'number' ? existingSiqs : 
    (typeof existingSiqs === 'object' && existingSiqs && 'score' in existingSiqs) ? existingSiqs.score : 0;
  
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Check cache first before fetching
  useEffect(() => {
    if (isVisible && latitude && longitude && !loading) {
      // Check if we have a cached result
      if (hasCachedSiqs(latitude, longitude)) {
        const cachedData = getCachedSiqs(latitude, longitude);
        if (cachedData && !forceUpdate) {
          onSiqsCalculated(cachedData.siqs, false, 8);
          return;
        }
      }
    }
  }, [isVisible, latitude, longitude, loading, onSiqsCalculated, forceUpdate]);
  
  // Memoize the fetch function to prevent unnecessary re-renders
  const fetchSiqs = useCallback(async () => {
    if (!latitude || !longitude || !isMountedRef.current) return;
    
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
      
      if (isMountedRef.current) {
        onSiqsCalculated(result.siqs, false, result.source === 'realtime' ? 9 : 7);
        setLastFetchTimestamp(Date.now());
      }
      
    } catch (error) {
      console.error("Error in RealTimeSiqsProvider:", error);
      
      // For certified locations, never use default scores if real-time fails
      if (isMountedRef.current) {
        if (isCertified) {
          onSiqsCalculated(null, false);
        } else if (existingSiqsNumber > 0) {
          onSiqsCalculated(existingSiqsNumber, false, 6);
        } else {
          onSiqsCalculated(null, false);
        }
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [latitude, longitude, bortleScale, isCertified, isDarkSkyReserve, existingSiqsNumber, onSiqsCalculated]);
  
  useEffect(() => {
    if (isVisible && latitude && longitude) {
      const shouldFetch = forceUpdate || 
                          (Date.now() - lastFetchTimestamp > REFRESH_INTERVAL);
      
      if (shouldFetch) {
        const fetchTimer = setTimeout(() => {
          fetchSiqs();
        }, isCertified ? 0 : 100); // Immediate for certified, slight delay for others
        
        return () => clearTimeout(fetchTimer);
      }
    }
  }, [isVisible, latitude, longitude, lastFetchTimestamp, fetchSiqs, forceUpdate, isCertified, REFRESH_INTERVAL]);
  
  return null; // This is a headless component
};

export default React.memo(RealTimeSiqsProvider);
