
import { useState, useEffect, useRef, useMemo } from 'react';

interface UseSiqsStateProps {
  realTimeSiqs: number | null;
  locationSiqs: number | null;
}

export function useSiqsState({ realTimeSiqs, locationSiqs }: UseSiqsStateProps) {
  const [stableSiqs, setStableSiqs] = useState<number | null>(null);
  const [displaySiqs, setDisplaySiqs] = useState<number | null>(locationSiqs);
  const [updateTime, setUpdateTime] = useState<number>(Date.now());
  const updateTimeoutRef = useRef<number | null>(null);
  
  // Track previous values to prevent unnecessary updates
  const prevRealTimeSiqs = useRef<number | null>(null);
  const prevLocationSiqs = useRef<number | null>(null);
  
  // Always prioritize existing SIQS data if available to prevent flickering
  useEffect(() => {
    if (locationSiqs && locationSiqs > 0 && prevLocationSiqs.current !== locationSiqs) {
      prevLocationSiqs.current = locationSiqs;
      setDisplaySiqs(locationSiqs);
      setStableSiqs(locationSiqs);
    }
  }, [locationSiqs]);
  
  // Update stable SIQS when real-time data is available, with improved debounce
  useEffect(() => {
    if (realTimeSiqs !== null && realTimeSiqs > 0 && prevRealTimeSiqs.current !== realTimeSiqs) {
      prevRealTimeSiqs.current = realTimeSiqs;
      
      // Always update stable SIQS (used during loading)
      setStableSiqs(realTimeSiqs);
      
      // Clear any existing timeout to prevent rapid updates
      if (updateTimeoutRef.current) {
        window.clearTimeout(updateTimeoutRef.current);
      }
      
      // Only update display SIQS if it's significantly different or after a delay
      const now = Date.now();
      if ((!displaySiqs || Math.abs(realTimeSiqs - displaySiqs) > 0.5) && 
          (now - updateTime > 2000)) {  // 2 second throttle
        
        updateTimeoutRef.current = window.setTimeout(() => {
          setDisplaySiqs(realTimeSiqs);
          setUpdateTime(Date.now());
          updateTimeoutRef.current = null;
        }, 500); // Increased delay to further reduce flickering
      }
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (updateTimeoutRef.current) {
        window.clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [realTimeSiqs, displaySiqs, updateTime]);

  // Memoize the final values to prevent unnecessary renders
  const memoizedResult = useMemo(() => ({
    stableSiqs,
    displaySiqs
  }), [stableSiqs, displaySiqs]);

  return memoizedResult;
}
