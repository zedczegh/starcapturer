
import React, { useState, useEffect } from 'react';
import RealTimeSiqsFetcher from './RealTimeSiqsFetcher';

interface RealTimeSiqsProviderProps {
  isVisible: boolean;
  latitude: number;
  longitude: number;
  isCertified?: boolean;
  isDarkSkyReserve?: boolean;
  bortleScale?: number;
  existingSiqs?: number | null;
  onSiqsCalculated: (siqs: number | null, loading: boolean, confidence?: number) => void;
  forceUpdate?: boolean;
}

const RealTimeSiqsProvider: React.FC<RealTimeSiqsProviderProps> = ({
  isVisible = true,
  latitude,
  longitude,
  isCertified = false,
  isDarkSkyReserve = false,
  bortleScale,
  existingSiqs,
  onSiqsCalculated,
  forceUpdate = false
}) => {
  const [retryCount, setRetryCount] = useState(0);
  const [lastAttemptTime, setLastAttemptTime] = useState(0);
  const [shouldCalculate, setShouldCalculate] = useState(isVisible);
  const [loadingState, setLoadingState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  
  // Enable calculation based on visibility
  useEffect(() => {
    if (isVisible && loadingState === 'idle') {
      setShouldCalculate(true);
    }
  }, [isVisible, loadingState]);
  
  // Force recalculation when requested
  useEffect(() => {
    if (forceUpdate) {
      setShouldCalculate(true);
      setLoadingState('idle');
      setRetryCount(0);
    }
  }, [forceUpdate]);
  
  // Handle automatic retries for important locations
  useEffect(() => {
    if (loadingState === 'error' && (isCertified || isDarkSkyReserve) && retryCount < 2) {
      const now = Date.now();
      if (now - lastAttemptTime > 5000) { // Don't retry too quickly
        const retryDelay = Math.min(2000 * (retryCount + 1), 5000);
        const timer = setTimeout(() => {
          setShouldCalculate(true);
          setRetryCount(prev => prev + 1);
        }, retryDelay);
        
        return () => clearTimeout(timer);
      }
    }
  }, [loadingState, isCertified, isDarkSkyReserve, retryCount, lastAttemptTime]);
  
  const handleSiqsCalculated = (siqs: number | null, loading: boolean, confidence?: number) => {
    if (loading) {
      setLoadingState('loading');
    } else if (siqs !== null && siqs > 0) {
      setLoadingState('success');
      onSiqsCalculated(siqs, loading, confidence);
    } else {
      setLoadingState('error');
      setLastAttemptTime(Date.now());
      // Still call the callback with null to allow UI to handle failure state
      onSiqsCalculated(null, false, confidence);
    }
  };
  
  // Different calculation priority for certified vs. regular locations
  const showRealTimeSiqs = isCertified || isDarkSkyReserve ? true : isVisible;
  
  return (
    <RealTimeSiqsFetcher
      isVisible={isVisible}
      showRealTimeSiqs={shouldCalculate && showRealTimeSiqs}
      latitude={latitude}
      longitude={longitude}
      bortleScale={bortleScale}
      onSiqsCalculated={handleSiqsCalculated}
      forceUpdate={forceUpdate}
    />
  );
};

export default React.memo(RealTimeSiqsProvider);
