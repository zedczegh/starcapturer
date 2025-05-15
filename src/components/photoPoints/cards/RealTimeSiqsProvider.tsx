
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
  debugLabel?: string;
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
  forceUpdate = false,
  debugLabel
}) => {
  const [initialized, setInitialized] = useState(false);
  
  // Immediately pass existing scores (including zero) to prevent N/A display
  useEffect(() => {
    if (!initialized) {
      // Extract numeric value from existingSiqs (can be number or object)
      const existingScore = getDisplaySiqs(existingSiqs);
      
      // Always report a score, even if it's zero - prevents N/A display
      onSiqsCalculated(existingScore || 0, false, 5);
      
      // If certified location, cache this value to avoid unnecessary recalculation
      if (isCertified && latitude && longitude && existingScore !== null && existingScore > 0) {
        setCachedRealTimeSiqs(latitude, longitude, existingScore);
      }
      
      if (existingScore !== null || forceUpdate) {
        setInitialized(true);
      }
    }
  }, [initialized, existingSiqs, isCertified, latitude, longitude, onSiqsCalculated, forceUpdate]);
  
  // Check for cached values
  useEffect(() => {
    if (!initialized && !forceUpdate && latitude && longitude) {
      const cachedSiqs = getCachedRealTimeSiqs(latitude, longitude);
      if (cachedSiqs !== null) {
        if (debugLabel) {
          console.log(`[${debugLabel}] Using cached SIQS for ${latitude.toFixed(4)},${longitude.toFixed(4)}: ${cachedSiqs}`);
        } else {
          console.log(`Using cached SIQS for ${latitude.toFixed(4)},${longitude.toFixed(4)}: ${cachedSiqs}`);
        }
        onSiqsCalculated(cachedSiqs, false, 8);
        setInitialized(true);
      } else if (existingSiqs) {
        // If no cache but we have existing siqs, use that
        const score = getDisplaySiqs(existingSiqs);
        if (score !== null) {
          onSiqsCalculated(score, false, 5);
        }
      }
    }
  }, [initialized, latitude, longitude, onSiqsCalculated, forceUpdate, debugLabel, existingSiqs]);
  
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
