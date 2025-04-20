
import { useState, useEffect, useRef } from 'react';

interface UseSiqsStateProps {
  realTimeSiqs: number | null;
  locationSiqs: number | null;
}

export function useSiqsState({ realTimeSiqs, locationSiqs }: UseSiqsStateProps) {
  const [stableSiqs, setStableSiqs] = useState<number | null>(null);
  const [displaySiqs, setDisplaySiqs] = useState<number | null>(locationSiqs);
  const [updateTime, setUpdateTime] = useState<number>(Date.now());
  const updateTimeoutRef = useRef<number | null>(null);
  
  // Always prioritize existing SIQS data if available to prevent flickering
  useEffect(() => {
    if (locationSiqs && locationSiqs > 0) {
      setDisplaySiqs(locationSiqs);
      setStableSiqs(locationSiqs);
    }
  }, [locationSiqs]);
  
  // Update stable SIQS when real-time data is available, with debounce
  useEffect(() => {
    if (realTimeSiqs !== null && realTimeSiqs > 0) {
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
        }, 300); // Short delay to batch updates
      }
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (updateTimeoutRef.current) {
        window.clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [realTimeSiqs, displaySiqs, updateTime]);

  return {
    stableSiqs,
    displaySiqs
  };
}
