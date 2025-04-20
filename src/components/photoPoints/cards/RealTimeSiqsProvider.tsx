
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
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes to reduce flickering

// Track pending calculations to prevent duplicate requests
const pendingCalculations = new Map<string, Promise<any>>();

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
  const positionKey = useRef<string>('');
  
  // Increase refresh interval to prevent flickering
  const REFRESH_INTERVAL = isCertified ? 5 * 60 * 1000 : 15 * 60 * 1000;
  
  // Extract SIQS from existingSiqs which can be in different formats
  const existingSiqsNumber = useCallback(() => {
    if (typeof existingSiqs === 'number') return existingSiqs;
    if (typeof existingSiqs === 'object' && existingSiqs) {
      if ('score' in existingSiqs) return existingSiqs.score;
      if ('siqs' in existingSiqs) return existingSiqs.siqs;
    }
    return 0;
  }, [existingSiqs])();
  
  const getCacheKey = useCallback(() => {
    if (!latitude || !longitude) return null;
    return `siqs-${latitude.toFixed(5)}-${longitude.toFixed(5)}-${bortleScale}`;
  }, [latitude, longitude, bortleScale]);
  
  // Initial setup effect
  useEffect(() => {
    isMounted.current = true;
    
    // Always start with existing SIQS to prevent flickering
    if (existingSiqsNumber > 0) {
      onSiqsCalculated(existingSiqsNumber, false, 8);
    }
    
    // Check for cached results first
    const cacheKey = getCacheKey();
    if (cacheKey && !forceUpdate) {
      const cached = resultCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
        onSiqsCalculated(cached.data.siqs, false, cached.data.source === 'realtime' ? 9 : 7);
        setFetchAttempted(true);
        console.log(`Using cached SIQS result for ${latitude},${longitude}`);
        return;
      }
    }
    
    // For certified locations, fetch immediately but only once
    if (isCertified && !fetchAttempted && isVisible) {
      console.log(`RealTimeSiqsProvider: Initiating immediate fetch for certified location at ${latitude},${longitude}`);
      fetchSiqs();
    }
    
    return () => {
      isMounted.current = false;
      if (fetchTimeoutRef.current) {
        window.clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = null;
      }
    };
  }, []);

  // Handle position changes
  useEffect(() => {
    if (latitude && longitude) {
      const newPositionKey = `${latitude.toFixed(5)}-${longitude.toFixed(5)}`;
      if (newPositionKey !== positionKey.current) {
        positionKey.current = newPositionKey;
        if (!isInitialFetch) {
          console.log(`Position changed to ${latitude.toFixed(5)},${longitude.toFixed(5)}, forcing new SIQS calculation`);
          setFetchAttempted(false);
          fetchSiqs();
        }
      }
    }
  }, [latitude, longitude]);
  
  // Handle initial fetch for certified locations
  useEffect(() => {
    if (isInitialFetch && isCertified) {
      // For certified locations, send existing SIQS first to prevent flickering
      if (existingSiqsNumber > 0) {
        onSiqsCalculated(existingSiqsNumber, false, 7);
      } else {
        onSiqsCalculated(null, true);
      }
      setIsInitialFetch(false);
      fetchSiqs();
    }
  }, [isInitialFetch, isCertified, existingSiqsNumber]);
  
  // Main fetch logic
  const fetchSiqs = useCallback(async () => {
    if (!latitude || !longitude || !isFinite(latitude) || !isFinite(longitude)) return;
    
    try {
      // Always use existing SIQS while loading to prevent flickering
      if (existingSiqsNumber > 0) {
        onSiqsCalculated(existingSiqsNumber, true, 7);
      } else {
        onSiqsCalculated(null, true);
      }
      
      // Check for pending calculation with same parameters
      const cacheKey = getCacheKey();
      if (cacheKey && pendingCalculations.has(cacheKey) && !forceUpdate) {
        console.log("Using already pending SIQS calculation");
        setLoading(true);
        
        try {
          const result = await pendingCalculations.get(cacheKey);
          if (isMounted.current) {
            onSiqsCalculated(result.siqs, false, result.source === 'realtime' ? 9 : 7);
          }
        } catch (error) {
          console.error("Error in pending SIQS calculation:", error);
          if (isMounted.current) {
            // Fall back to existing SIQS to prevent flickering
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
      
      // Only update if the new SIQS is valid
      if (result && typeof result.siqs === 'number' && result.siqs > 0) {
        onSiqsCalculated(result.siqs, false, result.source === 'realtime' ? 9 : 7);
        setLastFetchTimestamp(Date.now());
        
        // Update the cache
        if (cacheKey) {
          resultCache.set(cacheKey, {
            data: result,
            timestamp: Date.now()
          });
        }
      } else if (existingSiqsNumber > 0) {
        // Fall back to existing SIQS if new result is invalid
        onSiqsCalculated(existingSiqsNumber, false, 6);
      }
      
    } catch (error) {
      console.error("Error in RealTimeSiqsProvider:", error);
      
      if (!isMounted.current) return;
      
      // Always fall back to existing SIQS to prevent flickering
      if (existingSiqsNumber > 0) {
        onSiqsCalculated(existingSiqsNumber, false, 6);
      } else {
        onSiqsCalculated(null, false);
      }
    } finally {
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
  
  // Handle visibility and refresh timing
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
      // Increase delay for better performance and less flickering
      const delay = isCertified ? 
        Math.random() * 300 + (Math.abs(latitude) + Math.abs(longitude)) % 500 : 500;
      
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
