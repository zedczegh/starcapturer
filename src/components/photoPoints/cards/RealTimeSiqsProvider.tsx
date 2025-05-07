
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

// In-memory cache across all provider instances
const resultCache = new Map<string, {data: any, timestamp: number}>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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
  const [calculationComplete, setCalculationComplete] = useState(false);
  const isMounted = useRef(true);
  const fetchTimeoutRef = useRef<number | null>(null);
  const positionKey = useRef<string>('');
  
  const REFRESH_INTERVAL = isCertified ? 5 * 60 * 1000 : 5 * 60 * 1000; // 5 minutes for all
  
  const existingSiqsNumber = typeof existingSiqs === 'number' ? existingSiqs : 
    (typeof existingSiqs === 'object' && existingSiqs && 'score' in existingSiqs) ? existingSiqs.score : 0;
  
  const getCacheKey = useCallback(() => {
    if (!latitude || !longitude) return null;
    return `siqs-${latitude.toFixed(5)}-${longitude.toFixed(5)}-${bortleScale}`;
  }, [latitude, longitude, bortleScale]);
  
  useEffect(() => {
    isMounted.current = true;
    
    // Check for cached results first
    const cacheKey = getCacheKey();
    if (cacheKey && !forceUpdate) {
      const cached = resultCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
        onSiqsCalculated(cached.data.siqs, false, cached.data.source === 'realtime' ? 9 : 7);
        setFetchAttempted(true);
        setCalculationComplete(true);
        console.log(`Using cached SIQS result for ${latitude},${longitude}`);
        return;
      }
    }
    
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

  useEffect(() => {
    if (latitude && longitude) {
      const newPositionKey = `${latitude.toFixed(5)}-${longitude.toFixed(5)}`;
      if (newPositionKey !== positionKey.current) {
        positionKey.current = newPositionKey;
        if (!isInitialFetch) {
          console.log(`Position changed to ${latitude.toFixed(5)},${longitude.toFixed(5)}, forcing new SIQS calculation`);
          setFetchAttempted(false);
          setCalculationComplete(false);
          fetchSiqs();
        }
      }
    }
  }, [latitude, longitude]);
  
  useEffect(() => {
    if (isInitialFetch && isCertified) {
      onSiqsCalculated(null, true);
      setIsInitialFetch(false);
      fetchSiqs();
    }
  }, [isInitialFetch, isCertified]);
  
  const fetchSiqs = useCallback(async () => {
    if (!latitude || !longitude || !isFinite(latitude) || !isFinite(longitude) || calculationComplete) return;
    
    try {
      setLoading(true);
      setFetchAttempted(true);
      onSiqsCalculated(null, true);
      
      const useCache = !forceUpdate;
      
      const options: SiqsDisplayOptions = {
        skipCache: forceUpdate,
        useSingleHourSampling: true,
        targetHour: 1
      };
      
      const result = await getCompleteSiqsDisplay({
        latitude,
        longitude,
        bortleScale,
        isCertified,
        isDarkSkyReserve,
        existingSiqs: existingSiqsNumber,
        ...options
      });
      
      if (!isMounted.current) return;
      
      // Mark calculation as complete to prevent re-calculations
      setCalculationComplete(true);
      onSiqsCalculated(result.siqs, false, result.source === 'realtime' ? 9 : 7);
      setLastFetchTimestamp(Date.now());
      
      // Update the cache
      const cacheKey = getCacheKey();
      if (cacheKey) {
        resultCache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });
      }
      
    } catch (error) {
      console.error("Error in RealTimeSiqsProvider:", error);
      
      if (!isMounted.current) return;
      
      if (isCertified) {
        // For certified locations, use existing score if available
        if (existingSiqsNumber > 0) {
          onSiqsCalculated(existingSiqsNumber, false, 7);
          setCalculationComplete(true);
        } else {
          onSiqsCalculated(null, false);
        }
      } else if (existingSiqsNumber > 0) {
        onSiqsCalculated(existingSiqsNumber, false, 6);
        setCalculationComplete(true);
      } else {
        onSiqsCalculated(null, false);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setIsInitialFetch(false);
      }
    }
  }, [latitude, longitude, bortleScale, isCertified, isDarkSkyReserve, existingSiqsNumber, onSiqsCalculated, forceUpdate, getCacheKey, calculationComplete]);
  
  useEffect(() => {
    if (fetchTimeoutRef.current) {
      window.clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = null;
    }
    
    if (forceUpdate && !calculationComplete) {
      console.log("Force update triggered for SIQS calculation");
      fetchSiqs();
      return;
    }
    
    // Only fetch if we haven't already completed the calculation
    if (calculationComplete) {
      return;
    }
    
    // Reduce unnecessary fetches by checking visibility and cache
    const shouldFetch = 
      isVisible && 
      latitude && 
      longitude && 
      (!fetchAttempted || (Date.now() - lastFetchTimestamp > REFRESH_INTERVAL));
    
    if (shouldFetch) {
      // Use a staggered delay to prevent all components from fetching at once
      const delay = isCertified ? 
        Math.random() * 500 + (Math.abs(latitude) + Math.abs(longitude)) % 1000 : 0;
      
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
  }, [isVisible, latitude, longitude, lastFetchTimestamp, fetchSiqs, forceUpdate, isCertified, REFRESH_INTERVAL, fetchAttempted, calculationComplete]);
  
  return null;
};

export default React.memo(RealTimeSiqsProvider);
