
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { calculateRealTimeSiqs } from '@/services/realTimeSiqs/siqsCalculator';
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
  const [isInitialFetch, setIsInitialFetch] = useState(true);
  const [fetchAttempted, setFetchAttempted] = useState(false);
  const isMounted = useRef(true);
  const fetchTimeoutRef = useRef<number | null>(null);
  const positionKey = useRef<string>('');
  
  // For certified locations, refresh more frequently
  const REFRESH_INTERVAL = isCertified ? 30 * 1000 : 60 * 1000; // 30 seconds for certified, 60 seconds for others
  
  // Extract any existing SIQS value for fallback
  const existingSiqsNumber = typeof existingSiqs === 'number' ? existingSiqs : 
    (typeof existingSiqs === 'object' && existingSiqs && 'score' in existingSiqs) ? existingSiqs.score : 0;
  
  useEffect(() => {
    isMounted.current = true;
    
    // For certified locations, always start fetch immediately regardless of visibility
    if (isCertified && !fetchAttempted) {
      console.log(`RealTimeSiqsProvider: Initiating immediate fetch for certified location at ${latitude},${longitude}`);
      fetchSiqs();
    }
    
    // Cleanup function to prevent setState on unmounted component
    return () => {
      isMounted.current = false;
      if (fetchTimeoutRef.current) {
        window.clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = null;
      }
    };
  }, []);

  // Track position changes
  useEffect(() => {
    if (latitude && longitude) {
      const newPositionKey = `${latitude.toFixed(5)}-${longitude.toFixed(5)}`;
      if (newPositionKey !== positionKey.current) {
        positionKey.current = newPositionKey;
        // Position has changed, force a new fetch
        if (!isInitialFetch) {
          console.log(`Position changed to ${latitude.toFixed(5)},${longitude.toFixed(5)}, forcing new SIQS calculation`);
          setFetchAttempted(false);
          fetchSiqs();
        }
      }
    }
  }, [latitude, longitude]);
  
  // Immediately signal loading state for certified locations to avoid flickering
  useEffect(() => {
    if (isInitialFetch && isCertified) {
      // Tell the parent we're loading immediately to avoid showing default score
      onSiqsCalculated(null, true);
      setIsInitialFetch(false);
      
      // Trigger fetch immediately for certified locations
      fetchSiqs();
    }
  }, [isInitialFetch, isCertified]);
  
  // Memoize the fetch function to prevent unnecessary re-renders
  const fetchSiqs = useCallback(async () => {
    if (!latitude || !longitude || !isFinite(latitude) || !isFinite(longitude)) return;
    
    try {
      setLoading(true);
      setFetchAttempted(true);
      onSiqsCalculated(null, true);
      
      console.log(`Fetching real-time SIQS for ${latitude.toFixed(5)},${longitude.toFixed(5)}`);
      
      // Always force fresh calculation - no caching!
      const result = await calculateRealTimeSiqs(
        latitude, 
        longitude, 
        bortleScale
      );
      
      if (!isMounted.current) return;
      
      if (result && result.siqs > 0) {
        console.log(`Real-time SIQS calculation successful: ${result.siqs}`);
        onSiqsCalculated(result.siqs, false, 9);
      } else {
        console.warn("SIQS calculation returned invalid result:", result);
        onSiqsCalculated(existingSiqsNumber > 0 ? existingSiqsNumber : null, false);
      }
      
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
  }, [latitude, longitude, bortleScale, isCertified, existingSiqsNumber, onSiqsCalculated]);
  
  useEffect(() => {
    if (fetchTimeoutRef.current) {
      window.clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = null;
    }
    
    // Force a refresh when forceUpdate is true
    if (forceUpdate) {
      console.log("Force update triggered for SIQS calculation");
      fetchSiqs();
      return;
    }
    
    // For certified locations, we always want to fetch regardless of visibility
    const shouldFetch = !fetchAttempted || isCertified;
    
    // Always fetch for certified locations, regardless of visibility
    if ((isVisible || isCertified) && latitude && longitude && shouldFetch) {
      // Use a small delay for certified locations to avoid all fetches happening simultaneously
      // Spread them out based on their position in the list
      const delay = isCertified ? 
        Math.random() * 500 + (Math.abs(latitude) + Math.abs(longitude)) % 1000 : 0;
      
      fetchTimeoutRef.current = window.setTimeout(() => {
        fetchSiqs();
        fetchTimeoutRef.current = null;
      }, delay);
    }
    
    // Set up a refresh timer to periodically fetch new data
    const refreshTimer = setInterval(() => {
      if ((isVisible || isCertified) && latitude && longitude) {
        fetchSiqs();
      }
    }, REFRESH_INTERVAL);
    
    // Clear any pending timers on cleanup
    return () => {
      if (fetchTimeoutRef.current) {
        window.clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = null;
      }
      clearInterval(refreshTimer);
    };
  }, [isVisible, latitude, longitude, fetchSiqs, forceUpdate, isCertified, REFRESH_INTERVAL, fetchAttempted]);
  
  return null; // This is a headless component
};

export default React.memo(RealTimeSiqsProvider);
