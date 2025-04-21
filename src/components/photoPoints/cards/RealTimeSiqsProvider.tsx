
import React, { useEffect, useState, useRef } from 'react';
import { calculateRealTimeSiqs } from '@/services/realTimeSiqs/siqsCalculator';
import { hasCachedSiqs, getCachedSiqs, setSiqsCache } from '@/services/realTimeSiqs/siqsCache';
import { getSiqsScore } from '@/utils/siqsHelpers';

interface RealTimeSiqsProviderProps {
  latitude: number;
  longitude: number;
  bortleScale?: number;
  isCertified?: boolean;
  isDarkSkyReserve?: boolean;
  existingSiqs?: any;
  isVisible: boolean;
  onSiqsCalculated: (siqs: number | null, loading: boolean, confidenceScore?: number) => void;
  forceUpdate?: boolean;
}

const RealTimeSiqsProvider: React.FC<RealTimeSiqsProviderProps> = ({
  latitude,
  longitude,
  bortleScale = 4,
  isCertified = false,
  isDarkSkyReserve = false,
  existingSiqs,
  isVisible,
  onSiqsCalculated,
  forceUpdate = false
}) => {
  const [isCalculating, setIsCalculating] = useState(false);
  const [hasCalculated, setHasCalculated] = useState(false);
  const hasAttemptedRef = useRef(false);
  const cachedCheckDoneRef = useRef(false);

  // Check for cached SIQS first when component mounts or becomes visible
  useEffect(() => {
    if ((isVisible || forceUpdate) && !hasCalculated && !cachedCheckDoneRef.current) {
      cachedCheckDoneRef.current = true;
      
      // First try to use the cached value
      if (hasCachedSiqs(latitude, longitude) && !forceUpdate) {
        const cachedSiqs = getCachedSiqs(latitude, longitude);
        if (cachedSiqs && cachedSiqs.siqs > 0) {
          console.log(`Using cached SIQS: ${cachedSiqs.siqs} for ${latitude}, ${longitude}`);
          const confidenceScore = cachedSiqs.metadata?.reliability?.score || 8;
          onSiqsCalculated(cachedSiqs.siqs, false, confidenceScore);
          setHasCalculated(true);
          return;
        }
      }
      
      // If no valid cached value, check if we should calculate
      if (isCertified || isDarkSkyReserve || getSiqsScore(existingSiqs) > 0 || forceUpdate) {
        setIsCalculating(true);
        onSiqsCalculated(null, true);
      }
    }
  }, [isVisible, latitude, longitude, isCertified, isDarkSkyReserve, existingSiqs, onSiqsCalculated, hasCalculated, forceUpdate]);

  // Calculate real-time SIQS when component becomes visible
  useEffect(() => {
    const calculateSiqs = async () => {
      if (hasAttemptedRef.current || (!isVisible && !forceUpdate)) return;
      
      if ((isCertified || isDarkSkyReserve || getSiqsScore(existingSiqs) > 0 || forceUpdate) && 
          !hasCalculated && 
          !hasAttemptedRef.current) {
        
        hasAttemptedRef.current = true;
        setIsCalculating(true);
        
        try {
          console.log(`Calculating SIQS for ${latitude}, ${longitude} with forceUpdate=${forceUpdate}`);
          
          // Use the static SIQS if calculation fails
          const staticSiqs = getSiqsScore(existingSiqs);
          if (staticSiqs > 0) {
            console.log(`Using static SIQS: ${staticSiqs} as fallback`);
            onSiqsCalculated(staticSiqs, false, 7);
            setIsCalculating(false);
            setHasCalculated(true);
            return;
          }
          
          // Try to calculate real-time SIQS but catch errors
          try {
            const result = await calculateRealTimeSiqs(latitude, longitude, bortleScale);
            
            if (result && result.siqs > 0) {
              console.log(`SIQS calculated: ${result.siqs}`);
              const confidenceScore = result.metadata?.reliability?.score || 8;
              onSiqsCalculated(result.siqs, false, confidenceScore);
              
              // Save to cache
              setSiqsCache(latitude, longitude, result);
            } else {
              console.log("SIQS calculation returned no valid result, using fallback");
              if (staticSiqs > 0) {
                onSiqsCalculated(staticSiqs, false, 7);
              } else {
                onSiqsCalculated(null, false);
              }
            }
          } catch (error) {
            console.error("Error calculating real-time SIQS:", error);
            if (staticSiqs > 0) {
              console.log(`Using static SIQS: ${staticSiqs} after calculation error`);
              onSiqsCalculated(staticSiqs, false, 7);
            } else {
              onSiqsCalculated(null, false);
            }
          }
        } catch (error) {
          console.error("Error in SIQS logic:", error);
          onSiqsCalculated(null, false);
        } finally {
          setIsCalculating(false);
          setHasCalculated(true);
        }
      }
    };

    // Wait a bit before calculating to avoid unnecessary calculations for quickly scrolled items
    // For forceUpdate mode, calculate immediately
    const timeoutId = setTimeout(() => {
      if ((isVisible || forceUpdate) && !hasCalculated) {
        calculateSiqs();
      }
    }, forceUpdate ? 0 : 400);

    return () => clearTimeout(timeoutId);
  }, [isVisible, latitude, longitude, bortleScale, isCertified, isDarkSkyReserve, existingSiqs, onSiqsCalculated, hasCalculated, forceUpdate]);

  return null; // This is a non-visual component
};

export default React.memo(RealTimeSiqsProvider);
