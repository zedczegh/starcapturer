
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { getSiqsCacheKey, checkSiqsCache } from './siqsProvider/cacheManager';
import { fetchSiqsData, handleSiqsError } from './siqsProvider/siqsFetcher';
import { useIsMobile } from '@/hooks/use-mobile';

interface RealTimeSiqsProviderProps {
  latitude?: number;
  longitude?: number;
  bortleScale?: number;
  onSiqsCalculated: (siqs: number | null, loading: boolean, confidence?: number) => void;
  isVisible?: boolean;
  forceUpdate?: boolean;
  isCertified?: boolean;
  isDarkSkyReserve?: boolean;
  existingSiqs?: number | null | any;
  priorityLevel?: 'high' | 'medium' | 'low';
  debugLabel?: string;
}

const RealTimeSiqsProvider: React.FC<RealTimeSiqsProviderProps> = ({
  latitude,
  longitude,
  bortleScale = 4,
  onSiqsCalculated,
  isVisible = false,
  forceUpdate = false,
  isCertified = false,
  isDarkSkyReserve = false,
  existingSiqs = null,
  priorityLevel = 'medium',
  debugLabel = ''
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState<boolean>(false);
  const isMobile = useIsMobile();
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  
  // Convert existingSiqs to a number if possible
  const existingSiqsNumber = typeof existingSiqs === 'number' ? 
    existingSiqs : 
    (typeof existingSiqs === 'object' && existingSiqs && 'score' in existingSiqs) ? 
      existingSiqs.score : 0;

  // Calculate cache key for this location
  const cacheKey = getSiqsCacheKey(latitude, longitude, bortleScale);
  
  // Set retry delays based on device and priority
  const getRetryDelay = useCallback(() => {
    // Mobile devices use longer delays to save battery and prevent excessive requests
    if (isMobile) {
      switch (priorityLevel) {
        case 'high': return 5000;    // 5 seconds for high priority on mobile
        case 'medium': return 8000;  // 8 seconds for medium priority on mobile
        case 'low': return 15000;    // 15 seconds for low priority on mobile
        default: return 8000;
      }
    } else {
      switch (priorityLevel) {
        case 'high': return 2500;    // 2.5 seconds for high priority
        case 'medium': return 5000;  // 5 seconds for medium priority
        case 'low': return 10000;    // 10 seconds for low priority
        default: return 5000;
      }
    }
  }, [isMobile, priorityLevel]);

  // Reset the component when key details change
  useEffect(() => {
    if (forceUpdate) {
      setIsLoading(false);
      setHasAttemptedLoad(false);
    }
  }, [forceUpdate, latitude, longitude]);
  
  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
    };
  }, []);

  // Main effect for SIQS data fetching and caching
  useEffect(() => {
    // Skip if the component is not visible or coordinates are invalid
    if (!isVisible || !latitude || !longitude || !isFinite(latitude) || !isFinite(longitude)) {
      return;
    }
    
    // Skip if we've already attempted to load and we're not forcing an update
    if (hasAttemptedLoad && !forceUpdate && !isLoading) {
      return;
    }
    
    // Check cache first, unless we're forcing an update
    if (!forceUpdate && cacheKey) {
      const cachedResult = checkSiqsCache(cacheKey);
      if (cachedResult) {
        if (mountedRef.current) {
          const siqsScore = typeof cachedResult === 'number' ? 
            cachedResult : 
            (cachedResult && 'siqs' in cachedResult) ? 
              cachedResult.siqs : 
              (cachedResult && 'score' in cachedResult) ? 
                cachedResult.score : null;
                
          onSiqsCalculated(siqsScore, false, 8); // High confidence for cached results
          setHasAttemptedLoad(true);
          setIsLoading(false);
          return;
        }
      }
    }

    // Mark as loading and notify parent
    const startLoading = () => {
      if (mountedRef.current) {
        setIsLoading(true);
        onSiqsCalculated(null, true);
      }
    };

    // Delay for mobile devices to avoid too many simultaneous requests
    if (isMobile && !isLoading) {
      loadTimeoutRef.current = setTimeout(() => {
        startLoading();
        fetchSiqsForLocation();
      }, 100);
    } else if (!isLoading) {
      startLoading();
      fetchSiqsForLocation();
    }
    
    function fetchSiqsForLocation() {
      // Skip fetching if the component has unmounted
      if (!mountedRef.current) return;
      
      setHasAttemptedLoad(true);
      
      // Fetch data with the current parameters
      fetchSiqsData({
        latitude,
        longitude,
        bortleScale,
        isCertified,
        isDarkSkyReserve,
        existingSiqs: existingSiqsNumber,
        skipCache: forceUpdate,
        cacheKey,
        onSuccess: (result) => {
          if (!mountedRef.current) return;
          
          const siqsValue = typeof result === 'number' ? 
            result : 
            (result && 'siqs' in result) ? 
              result.siqs : 
              (result && 'score' in result) ? 
                result.score : null;
          
          // Calculate confidence score based on data source
          const confidence = result && 'confidence' in result ? result.confidence : 
            (result && 'level' in result && result.level === 'precise') ? 9 : 7;
          
          onSiqsCalculated(siqsValue, false, confidence);
          setIsLoading(false);
        },
        onError: (error) => {
          if (!mountedRef.current) return;
          console.error(`Error calculating SIQS${debugLabel ? ' for ' + debugLabel : ''}:`, error);
          
          // Handle errors by falling back to existing values if available
          handleSiqsError({
            isCertified, 
            existingSiqsNumber,
            onSiqsCalculated
          });
          
          setIsLoading(false);
          
          // Retry with delay for important locations or certified spots
          if ((isCertified || priorityLevel === 'high') && mountedRef.current) {
            loadTimeoutRef.current = setTimeout(() => {
              if (mountedRef.current) {
                fetchSiqsForLocation();
              }
            }, getRetryDelay());
          }
        }
      });
    }
    
    // Cleanup function for the effect
    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
    };
  }, [
    latitude, 
    longitude, 
    bortleScale, 
    isVisible, 
    forceUpdate, 
    hasAttemptedLoad, 
    isCertified, 
    isDarkSkyReserve, 
    existingSiqsNumber,
    isLoading,
    cacheKey,
    debugLabel,
    onSiqsCalculated,
    getRetryDelay,
    isMobile,
    priorityLevel
  ]);

  // This is an invisible component, it just manages the data
  return null;
};

export default RealTimeSiqsProvider;
