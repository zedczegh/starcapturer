
import React, { useEffect, useRef } from 'react';
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
  const { siqsScore, loading, calculateSiqs } = useRealTimeSiqs({
    skipCache: forceUpdate,
    refreshInterval: isCertified ? 300000 : 900000 // 5 mins for certified, 15 for others
  });
  
  // Only calculate when visible and have coordinates
  useEffect(() => {
    if (!isVisible || !latitude || !longitude) return;
    
    const newPositionKey = `${latitude.toFixed(5)}-${longitude.toFixed(5)}`;
    if (positionRef.current === newPositionKey && !forceUpdate) return;
    
    positionRef.current = newPositionKey;
    
    calculateSiqs(latitude, longitude, bortleScale);
  }, [isVisible, latitude, longitude, bortleScale, forceUpdate, calculateSiqs]);

  // Notify parent of SIQS updates
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
