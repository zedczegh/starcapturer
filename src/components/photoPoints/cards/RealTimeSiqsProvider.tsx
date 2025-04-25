
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
    performSiqsCalculation();
  }, [isVisible, performSiqsCalculation, forceUpdate]);
  
  // Notify parent of SIQS updates with confidence value
  useEffect(() => {
    onSiqsCalculated(
      siqsScore, 
      loading,
      siqsScore ? (forceUpdate ? 9 : 7) : undefined
    );
  }, [siqsScore, loading, onSiqsCalculated, forceUpdate]);
  
  return null;
};

export default React.memo(RealTimeSiqsProvider);
