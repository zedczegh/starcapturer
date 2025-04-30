
import React, { useEffect, useRef, useCallback } from 'react';
import { useRealTimeSiqs } from '@/hooks/siqs/useRealTimeSiqs';
import { getSiqsScore } from '@/utils/siqsHelpers';

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
  skipCache?: boolean;
}

// Global map to track pending calculations across components
const pendingCalculations = new Map<string, number>();

const RealTimeSiqsProvider: React.FC<RealTimeSiqsProviderProps> = ({
  isVisible,
  latitude,
  longitude,
  bortleScale = 4,
  isCertified = false,
  isDarkSkyReserve = false,
  existingSiqs,
  onSiqsCalculated,
  forceUpdate = false,
  skipCache = false
}) => {
  const positionRef = useRef<string>('');
  const lastCalculationRef = useRef<number>(0);
  const hasNotifiedRef = useRef<boolean>(false);
  const timeoutRef = useRef<number | null>(null);
  
  // Configuration based on location type
  const refreshInterval = isCertified ? 300000 : 900000; // 5 mins for certified, 15 for others
  
  // Calculate priority based on certification status
  const priority = isDarkSkyReserve ? 10 : (isCertified ? 5 : 1);
  
  const { siqsScore, loading, calculateSiqs } = useRealTimeSiqs({
    skipCache: skipCache || forceUpdate,
    refreshInterval,
    priority
  });
  
  // Only perform calculation if the component is visible and we have coordinates
  const performSiqsCalculation = useCallback(() => {
    if (!latitude || !longitude || !isVisible) return;
    
    const now = Date.now();
    const newPositionKey = `${latitude.toFixed(5)}-${longitude.toFixed(5)}`;
    
    // Skip if same position and not forced
    if (positionRef.current === newPositionKey && !forceUpdate) {
      // But still refresh if enough time has passed
      if (now - lastCalculationRef.current < refreshInterval) {
        return;
      }
    }
    
    positionRef.current = newPositionKey;
    lastCalculationRef.current = now;
    
    // Throttle calculations based on priority and pending calculations
    const pendingCount = pendingCalculations.size;
    const calculationKey = `${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
    
    // Check if this location is already being calculated
    if (pendingCalculations.has(calculationKey) && !forceUpdate) {
      return;
    }
    
    // Add this calculation to pending map
    pendingCalculations.set(calculationKey, now);
    
    // Calculate delay based on priority and pending calculations
    let delay = 0;
    if (pendingCount > 3 && priority < 5) {
      delay = Math.min(pendingCount * 50, 400);
    }
    
    if (delay > 0) {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = window.setTimeout(() => {
        calculateSiqs(latitude, longitude, bortleScale)
          .finally(() => {
            pendingCalculations.delete(calculationKey);
          });
        timeoutRef.current = null;
      }, delay);
    } else {
      calculateSiqs(latitude, longitude, bortleScale)
        .finally(() => {
          pendingCalculations.delete(calculationKey);
        });
    }
  }, [latitude, longitude, bortleScale, calculateSiqs, forceUpdate, refreshInterval, isVisible, priority, skipCache]);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  // Calculate when visible and have coordinates
  useEffect(() => {
    if (!isVisible) return;
    
    // Use a small random delay to prevent all calculations starting simultaneously
    const timer = window.setTimeout(() => {
      performSiqsCalculation();
    }, Math.random() * 150);
    
    return () => window.clearTimeout(timer);
  }, [isVisible, performSiqsCalculation, forceUpdate]);
  
  // Notify parent of SIQS updates
  useEffect(() => {
    // Always notify parent of loading state changes
    onSiqsCalculated(
      siqsScore, 
      loading,
      siqsScore ? (forceUpdate ? 9 : 7) : undefined
    );
    
    // Mark that we've notified the parent
    hasNotifiedRef.current = true;
  }, [siqsScore, loading, onSiqsCalculated, forceUpdate]);
  
  // Send existing SIQS if available while loading
  useEffect(() => {
    if (loading && !hasNotifiedRef.current && existingSiqs) {
      const staticSiqs = getSiqsScore(existingSiqs);
      if (staticSiqs !== null && staticSiqs > 0) {
        onSiqsCalculated(staticSiqs, false, 5);
        hasNotifiedRef.current = true;
      }
    }
  }, [loading, existingSiqs, onSiqsCalculated]);
  
  return null;
};

export default React.memo(RealTimeSiqsProvider);
