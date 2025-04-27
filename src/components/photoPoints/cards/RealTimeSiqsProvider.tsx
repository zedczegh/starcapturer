
import React, { useEffect, useRef, useCallback } from 'react';
import { useRealTimeSiqs } from '@/hooks/siqs/useRealTimeSiqs';

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
  existingSiqs,
  onSiqsCalculated,
  forceUpdate = false
}) => {
  const positionRef = useRef<string>('');
  const lastCalculationRef = useRef<number>(0);
  const hasNotifiedRef = useRef<boolean>(false);
  
  // Configuration based on location type
  const refreshInterval = isCertified ? 300000 : 900000; // 5 mins for certified, 15 for others
  
  const { siqsScore, loading, calculateSiqs } = useRealTimeSiqs({
    skipCache: forceUpdate,
    refreshInterval
  });
  
  // Callback for SIQS calculation
  const performSiqsCalculation = useCallback(() => {
    if (!latitude || !longitude) return;
    
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
    
    calculateSiqs(latitude, longitude, bortleScale);
  }, [latitude, longitude, bortleScale, calculateSiqs, forceUpdate, refreshInterval]);
  
  // Only calculate when visible and have coordinates
  useEffect(() => {
    if (!isVisible) return;
    
    // Short delay to prevent all calculations happening at once
    const timer = setTimeout(() => {
      performSiqsCalculation();
    }, Math.random() * 500);
    
    return () => clearTimeout(timer);
  }, [isVisible, performSiqsCalculation, forceUpdate]);
  
  // Notify parent of SIQS updates with confidence value
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
  
  // Send existing SIQS if available and we're still loading
  useEffect(() => {
    if (loading && existingSiqs && existingSiqs > 0 && !hasNotifiedRef.current) {
      onSiqsCalculated(existingSiqs, false, 5);
      hasNotifiedRef.current = true;
    }
  }, [loading, existingSiqs, onSiqsCalculated]);
  
  return null;
};

export default React.memo(RealTimeSiqsProvider);
