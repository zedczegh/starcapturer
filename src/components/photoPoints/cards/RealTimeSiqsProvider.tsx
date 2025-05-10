
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { checkSiqsCache, getSiqsCacheKey } from './siqsProvider/cacheManager';
import { fetchSiqsData, handleSiqsError } from './siqsProvider/siqsFetcher';
import { processQueue } from './siqsProvider/queueManager';
import type { RealTimeSiqsProviderProps } from './siqsProvider/types';

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
    return getSiqsCacheKey(latitude, longitude, bortleScale);
  }, [latitude, longitude, bortleScale]);

  // Execute fetch with queueing
  const executeFetch = useCallback((fetchFn: () => Promise<void>) => {
    const cacheKey = getCacheKey();
    
    // First check both caches
    const cachedData = checkSiqsCache(cacheKey, forceUpdate);
    if (cachedData) {
      onSiqsCalculated(cachedData.siqs, false, cachedData.source === 'realtime' ? 9 : 7);
      setFetchAttempted(true);
      setCalculationComplete(true);
      console.log(`Using cached SIQS result for ${latitude},${longitude}`);
      return Promise.resolve();
    }
    
    // Queue or execute the fetch based on current load
    setLoading(true);
    setFetchAttempted(true);
    onSiqsCalculated(null, true);
    
    return fetchSiqsData({
      latitude,
      longitude,
      bortleScale,
      isCertified,
      isDarkSkyReserve,
      existingSiqs,
      skipCache: forceUpdate,
      cacheKey,
      onSuccess: (result) => {
        if (!isMounted.current) return;
        
        setCalculationComplete(true);
        onSiqsCalculated(result.siqs, false, result.source === 'realtime' ? 9 : 7);
        setLastFetchTimestamp(Date.now());
        setLoading(false);
      },
      onError: (error) => {
        if (!isMounted.current) return;
        
        handleSiqsError({ 
          isCertified, 
          existingSiqsNumber, 
          onSiqsCalculated 
        });
        
        setLoading(false);
      }
    });
  }, [
    getCacheKey, 
    latitude, 
    longitude, 
    bortleScale, 
    isCertified, 
    isDarkSkyReserve, 
    existingSiqs, 
    onSiqsCalculated, 
    forceUpdate, 
    existingSiqsNumber
  ]);
  
  useEffect(() => {
    isMounted.current = true;
    
    // Check for cached results first
    const cacheKey = getCacheKey();
    const cachedData = checkSiqsCache(cacheKey, forceUpdate);
    
    if (cachedData) {
      onSiqsCalculated(cachedData.siqs, false, cachedData.source === 'realtime' ? 9 : 7);
      setFetchAttempted(true);
      setCalculationComplete(true);
      console.log(`Using cached SIQS result for ${latitude},${longitude}`);
      return;
    }
    
    if (isCertified && !fetchAttempted && isVisible) {
      console.log(`RealTimeSiqsProvider: Initiating immediate fetch for certified location at ${latitude},${longitude}`);
      executeFetch(() => Promise.resolve());
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
          executeFetch(() => Promise.resolve());
        }
      }
    }
  }, [latitude, longitude]);
  
  useEffect(() => {
    if (isInitialFetch && isCertified) {
      onSiqsCalculated(null, true);
      setIsInitialFetch(false);
      executeFetch(() => Promise.resolve());
    }
  }, [isInitialFetch, isCertified]);
  
  useEffect(() => {
    if (fetchTimeoutRef.current) {
      window.clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = null;
    }
    
    if (forceUpdate && !calculationComplete) {
      console.log("Force update triggered for SIQS calculation");
      executeFetch(() => Promise.resolve());
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
        Math.random() * 500 + (Math.abs(latitude || 0) + Math.abs(longitude || 0)) % 1000 : 0;
      
      fetchTimeoutRef.current = window.setTimeout(() => {
        executeFetch(() => Promise.resolve());
        fetchTimeoutRef.current = null;
      }, delay);
    }
    
    return () => {
      if (fetchTimeoutRef.current) {
        window.clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = null;
      }
    };
  }, [isVisible, latitude, longitude, lastFetchTimestamp, executeFetch, forceUpdate, isCertified, REFRESH_INTERVAL, fetchAttempted, calculationComplete]);
  
  return null;
};

export default React.memo(RealTimeSiqsProvider);
