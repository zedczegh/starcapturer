
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  const isMounted = useRef(true);
  const fetchTimeoutRef = useRef<number | null>(null);
  
  // Use shorter cache duration for certified locations and force refresh more aggressively
  const REFRESH_INTERVAL = isCertified ? 30 * 1000 : 5 * 60 * 1000; // 30 seconds for certified, 5 min for others
  
  // Extract any existing SIQS value for fallback
  const existingSiqsNumber = typeof existingSiqs === 'number' ? existingSiqs : 
    (typeof existingSiqs === 'object' && existingSiqs && 'score' in existingSiqs) ? existingSiqs.score : 0;
  
  useEffect(() => {
    isMounted.current = true;
    // Cleanup function to prevent setState on unmounted component
    return () => {
      isMounted.current = false;
      if (fetchTimeoutRef.current) {
        window.clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = null;
      }
    };
  }, []);
  
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
    if (!latitude || !longitude || !isFinite(latitude) || !isFinite(longitude)) return;
    
    try {
      setLoading(true);
      setFetchAttempted(true);
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
      
      if (!isMounted.current) return;
      
      onSiqsCalculated(result.siqs, false, result.source === 'realtime' ? 9 : 7);
      setLastFetchTimestamp(Date.now());
      
    } catch (error) {
      console.error("Error in RealTimeSiqsProvider:", error);
      
      if (!isMounted.current) return;
      
      // For certified locations, never use default scores if real-time fails
      if (isCertified) {
        onSiqsCalculated(null, false);
      } else if (existingSiqsNumber > 0) {
        onSiqsCalculated(existingSiqsNumber, false, 6);
      } else {
        onSiqsCalculated(null, false);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setIsInitialFetch(false);
      }
    }
  }, [latitude, longitude, bortleScale, isCertified, isDarkSkyReserve, existingSiqsNumber, onSiqsCalculated]);
  
  useEffect(() => {
    if (fetchTimeoutRef.current) {
      window.clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = null;
    }
    
    if (isVisible && latitude && longitude) {
      const shouldFetch = 
          forceUpdate || 
          !fetchAttempted ||
          (Date.now() - lastFetchTimestamp > REFRESH_INTERVAL) ||
          (isCertified && !fetchAttempted); // Always fetch for certified locations on first visibility
      
      if (shouldFetch) {
        // Use a small delay for certified locations to avoid all fetches happening simultaneously
        const delay = isCertified ? Math.random() * 500 + 100 : 0; // Random delay up to 600ms for certified locations
        
        fetchTimeoutRef.current = window.setTimeout(() => {
          fetchSiqs();
          fetchTimeoutRef.current = null;
        }, delay);
      }
    }
    
    // Clear any pending timers on cleanup
    return () => {
      if (fetchTimeoutRef.current) {
        window.clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = null;
      }
    };
  }, [isVisible, latitude, longitude, lastFetchTimestamp, fetchSiqs, forceUpdate, isCertified, REFRESH_INTERVAL, fetchAttempted]);
  
  return null; // This is a headless component
};

export default React.memo(RealTimeSiqsProvider);
