
import React, { useState, useEffect, useCallback } from 'react';
import RealTimeSiqsFetcher from './RealTimeSiqsFetcher';
import { getCachedRealTimeSiqs, setCachedRealTimeSiqs } from '@/utils/siqs/display/siqsCache';
import { getDisplaySiqs } from '@/utils/unifiedSiqsDisplay';

interface RealTimeSiqsProviderProps {
  isVisible: boolean;
  latitude?: number;
  longitude?: number;
  bortleScale?: number;
  isCertified?: boolean;
  isDarkSkyReserve?: boolean;
  existingSiqs?: number | any;
  onSiqsCalculated: (siqs: number | null, loading: boolean, confidence?: number) => void;
  priorityLevel?: 'high' | 'medium' | 'low';
  forceUpdate?: boolean;
}

const RealTimeSiqsProvider: React.FC<RealTimeSiqsProviderProps> = ({
  isVisible,
  latitude,
  longitude,
  bortleScale,
  isCertified = false,
  isDarkSkyReserve = false,
  existingSiqs,
  onSiqsCalculated,
  priorityLevel = 'low',
  forceUpdate = false
}) => {
  const [initialized, setInitialized] = useState(false);
  
  // Initialize with existing scores when available
  useEffect(() => {
    if (!initialized && existingSiqs && !forceUpdate) {
      const existingScore = getDisplaySiqs(existingSiqs);
      if (existingScore !== null) {
        onSiqsCalculated(existingScore, false);
        
        // If certified location, cache this value to avoid unnecessary recalculation
        if (isCertified && latitude && longitude) {
          setCachedRealTimeSiqs(latitude, longitude, existingScore);
        }
      }
      setInitialized(true);
    }
  }, [initialized, existingSiqs, isCertified, latitude, longitude, onSiqsCalculated, forceUpdate]);
  
  // Check for cached values
  useEffect(() => {
    if (!initialized && !forceUpdate && latitude && longitude) {
      const cachedSiqs = getCachedRealTimeSiqs(latitude, longitude);
      if (cachedSiqs !== null) {
        console.log(`Using cached SIQS for ${latitude.toFixed(4)},${longitude.toFixed(4)}: ${cachedSiqs}`);
        onSiqsCalculated(cachedSiqs, false);
        setInitialized(true);
      }
    }
  }, [initialized, latitude, longitude, onSiqsCalculated, forceUpdate]);
  
  // Only calculate new scores if we need to
  const showRealTimeSiqs = (
    (isVisible && latitude && longitude) && 
    (forceUpdate || !initialized || (initialized && priorityLevel === 'high'))
  );
  
  return (
    <RealTimeSiqsFetcher
      isVisible={isVisible}
      showRealTimeSiqs={showRealTimeSiqs}
      latitude={latitude}
      longitude={longitude}
      bortleScale={bortleScale}
      onSiqsCalculated={onSiqsCalculated}
    />
  );
};

export default React.memo(RealTimeSiqsProvider);
