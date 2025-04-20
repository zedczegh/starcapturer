import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getCompleteSiqsDisplay } from '@/utils/unifiedSiqsDisplay';
import { SiqsDisplayOptions } from '@/services/realTimeSiqs/siqsTypes';

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

// In-memory cache across all provider instances with improved structure
const resultCache = new Map<string, {data: any, timestamp: number}>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Track pending calculations to prevent duplicate requests
const pendingCalculations = new Map<string, Promise<any>>();

// Static counters and limits for API calls, shared across all instances
let activeApiCalls = 0;
const MAX_CONCURRENT_CALLS = 5;

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
  const loadingTimeoutRef = useRef<number | null>(null);
  const positionKey = useRef<string>('');
  
  // Increase cache duration for certified locations to reduce flashing
  const CACHE_DURATION_CERTIFIED = isCertified ? 30 * 60 * 1000 : 5 * 60 * 1000; // 30 mins for certified, 5 mins for others
  
  const REFRESH_INTERVAL = isCertified ? 30 * 1000 : 5 * 60 * 1000;
  
  const existingSiqsNumber = typeof existingSiqs === 'number' ? existingSiqs : 
    (typeof existingSiqs === 'object' && existingSiqs && 'score' in existingSiqs) ? existingSiqs.score : null;
  
  const getCacheKey = useCallback(() => {
    if (!latitude || !longitude) return null;
    return `siqs-${latitude.toFixed(5)}-${longitude.toFixed(5)}-${bortleScale}`;
  }, [latitude, longitude, bortleScale]);
  
  // Calculate SIQS first time immediately on mount
  useEffect(() => {
    isMounted.current = true;
    
    // For certified locations or when forced, calculate immediately
    if ((isCertified || forceUpdate) && latitude && longitude && isVisible) {
      console.log(`RealTimeSiqsProvider: Immediate fetch on mount for location at ${latitude},${longitude}`);
      fetchSiqs();
    }
    
    return () => {
      isMounted.current = false;
      if (fetchTimeoutRef.current) {
        window.clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = null;
      }
      if (loadingTimeoutRef.current) {
        window.clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (latitude && longitude) {
      const newPositionKey = `${latitude.toFixed(5)}-${longitude.toFixed(5)}`;
      if (newPositionKey !== positionKey.current) {
        positionKey.current = newPositionKey;
        setFetchAttempted(false);
        fetchSiqs();
      }
    }
  }, [latitude, longitude]);
  
  // Force initial SIQS calculation for certified locations
  useEffect(() => {
    if (isInitialFetch && isCertified) {
      onSiqsCalculated(null, true);
      setIsInitialFetch(false);
      fetchSiqs();
    }
  }, [isInitialFetch, isCertified]);
  
  // Force recalculation when forceUpdate changes
  useEffect(() => {
    if (forceUpdate && latitude && longitude) {
      console.log(`Forcing SIQS update for ${latitude},${longitude}`);
      fetchSiqs();
    }
  }, [forceUpdate, latitude, longitude]);
  
  const fetchSiqs = useCallback(async () => {
    if (!latitude || !longitude || !isFinite(latitude) || !isFinite(longitude)) return;
    
    // Check if we're already at the maximum concurrent calls
    if (activeApiCalls >= MAX_CONCURRENT_CALLS) {
      console.log("Maximum concurrent SIQS API calls reached, waiting...");
      return;
    }
    
    activeApiCalls++;
    
    try {
      // Check for pending calculation with same parameters
      const cacheKey = getCacheKey();
      if (cacheKey && pendingCalculations.has(cacheKey) && !forceUpdate) {
        console.log("Using already pending SIQS calculation");
        setLoading(true);
        onSiqsCalculated(null, true);
        
        try {
          const result = await pendingCalculations.get(cacheKey);
          if (isMounted.current) {
            onSiqsCalculated(result.siqs, false, result.source === 'realtime' ? 9 : 7);
          }
        } catch (error) {
          console.error("Error in pending SIQS calculation:", error);
          if (isMounted.current) {
            onSiqsCalculated(existingSiqsNumber > 0 ? existingSiqsNumber : null, false);
          }
        } finally {
          if (isMounted.current) {
            setLoading(false);
          }
        }
        return;
      }
      
      setLoading(true);
      setFetchAttempted(true);
      onSiqsCalculated(null, true);
      
      // For certified locations, try to use cached data for faster response initially
      if (isCertified && cacheKey) {
        const cached = resultCache.get(cacheKey);
        if (cached && cached.data && cached.data.siqs > 0) {
          onSiqsCalculated(cached.data.siqs, false, 7);
          // Still continue with fresh calculation but don't show loading state
        }
      }
      
      // First create the complete options object with all required properties
      const options: SiqsDisplayOptions = {
        latitude,
        longitude,
        bortleScale,
        isCertified,
        isDarkSkyReserve,
        existingSiqs: existingSiqsNumber,
        skipCache: forceUpdate,
        useSingleHourSampling: true,
        targetHour: 1
      };
      
      // Create a promise for this calculation and store it
      const calculationPromise = getCompleteSiqsDisplay(options);
      if (cacheKey) {
        pendingCalculations.set(cacheKey, calculationPromise);
      }
      
      const result = await calculationPromise;
      
      if (cacheKey) {
        pendingCalculations.delete(cacheKey);
      }
      
      if (!isMounted.current) return;
      
      onSiqsCalculated(result.siqs, false, result.source === 'realtime' ? 9 : 7);
      setLastFetchTimestamp(Date.now());
      
      // Update the cache
      if (cacheKey) {
        resultCache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });
      }
      
    } catch (error) {
      console.error("Error in RealTimeSiqsProvider:", error);
      
      if (!isMounted.current) return;
      
      // Fall back to existing SIQS if available
      if (existingSiqsNumber && existingSiqsNumber > 0) {
        onSiqsCalculated(existingSiqsNumber, false, 6);
      } else if (isCertified) {
        // For certified locations, keep showing loading state
        onSiqsCalculated(null, false);
      } else {
        onSiqsCalculated(null, false);
      }
    } finally {
      activeApiCalls--;
      if (isMounted.current) {
        setLoading(false);
        setIsInitialFetch(false);
        
        // Remove from pending calculations if there was an error
        const cacheKey = getCacheKey();
        if (cacheKey && pendingCalculations.has(cacheKey)) {
          pendingCalculations.delete(cacheKey);
        }
      }
    }
  }, [latitude, longitude, bortleScale, isCertified, isDarkSkyReserve, existingSiqsNumber, onSiqsCalculated, forceUpdate, getCacheKey]);
  
  useEffect(() => {
    if (fetchTimeoutRef.current) {
      window.clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = null;
    }
    
    if (forceUpdate) {
      console.log("Force update triggered for SIQS calculation");
      fetchSiqs();
      return;
    }
    
    // More efficient check for whether we should fetch
    const shouldFetch = 
      isVisible && 
      latitude && 
      longitude && 
      (!fetchAttempted || (Date.now() - lastFetchTimestamp > REFRESH_INTERVAL));
    
    if (shouldFetch) {
      // Use a staggered delay to prevent all components from fetching at once
      // Reduce delay for better performance
      const delay = isCertified ? 
        Math.random() * 200 + (Math.abs(latitude) + Math.abs(longitude)) % 500 : 0;
      
      fetchTimeoutRef.current = window.setTimeout(() => {
        fetchSiqs();
        fetchTimeoutRef.current = null;
      }, delay);
    }
    
    return () => {
      if (fetchTimeoutRef.current) {
        window.clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = null;
      }
    };
  }, [isVisible, latitude, longitude, lastFetchTimestamp, fetchSiqs, forceUpdate, isCertified, REFRESH_INTERVAL, fetchAttempted]);
  
  return null;
};

// Use memo to prevent unnecessary re-renders
export default React.memo(RealTimeSiqsProvider);
