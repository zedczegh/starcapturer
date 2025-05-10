
import React, { useState, useEffect, useCallback } from 'react';
import { calculateSiqs } from '@/services/realTimeSiqs/siqsCalculatorAdapter';

interface RealTimeSiqsProviderProps {
  latitude: number;
  longitude: number;
  onSiqsCalculated?: (siqs: number | null, loading: boolean, confidence?: number) => void;
  isVisible?: boolean;
  forceUpdate?: boolean;
  bortleScale?: number;
  isCertified?: boolean;
  isDarkSkyReserve?: boolean;
  existingSiqs?: number | { score: number; isViable?: boolean } | null;
}

const RealTimeSiqsProvider: React.FC<RealTimeSiqsProviderProps> = ({
  latitude,
  longitude,
  onSiqsCalculated,
  isVisible = true,
  forceUpdate = false,
  bortleScale,
  isCertified = false,
  isDarkSkyReserve = false,
  existingSiqs = null
}) => {
  const [loading, setLoading] = useState(false);
  const [calculatedSiqs, setCalculatedSiqs] = useState<number | null>(null);
  const [hasAttemptedCalculation, setHasAttemptedCalculation] = useState(false);
  const [lastCalculatedCoords, setLastCalculatedCoords] = useState<string>('');
  const [siqsConfidence, setSiqsConfidence] = useState<number>(7);
  
  const calculateSiqsValue = useCallback(async () => {
    if (!isVisible || !isFinite(latitude) || !isFinite(longitude)) {
      return;
    }
    
    // Check if calculation is needed
    const coordsKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
    if (coordsKey === lastCalculatedCoords && calculatedSiqs && !forceUpdate) {
      return;
    }
    
    try {
      setLoading(true);
      if (onSiqsCalculated) onSiqsCalculated(null, true);
      
      // Use the cached SIQS value if available
      const cachedSiqs = localStorage.getItem(`siqs_cache_${coordsKey}`);
      if (cachedSiqs && !forceUpdate) {
        try {
          const parsed = JSON.parse(cachedSiqs);
          if (parsed.siqs && parsed.expiry > Date.now()) {
            setCalculatedSiqs(parsed.siqs);
            setSiqsConfidence(parsed.confidence || 7);
            setLastCalculatedCoords(coordsKey);
            if (onSiqsCalculated) onSiqsCalculated(parsed.siqs, false, parsed.confidence);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error("Error parsing cached SIQS:", e);
        }
      }
      
      // For user location marker, calculate SIQS with higher priority
      const siqs = await calculateSiqs(latitude, longitude, bortleScale, {
        priority: isCertified || isDarkSkyReserve ? 'high' : 'normal',
        useCache: !forceUpdate,
        fallbackToExisting: Boolean(existingSiqs)
      });
      
      // Handle result
      if (siqs) {
        setCalculatedSiqs(siqs.score);
        setSiqsConfidence(siqs.confidence || 7);
        
        // Cache result
        try {
          const cacheData = {
            siqs: siqs.score,
            confidence: siqs.confidence || 7,
            expiry: Date.now() + (isCertified ? 30 * 60 * 1000 : 15 * 60 * 1000) // 30 min for certified, 15 for regular
          };
          localStorage.setItem(`siqs_cache_${coordsKey}`, JSON.stringify(cacheData));
        } catch (e) {
          console.error("Error caching SIQS:", e);
        }
        
        if (onSiqsCalculated) onSiqsCalculated(siqs.score, false, siqs.confidence);
      } else {
        // Use existing SIQS if available as fallback
        if (existingSiqs) {
          const existingSiqsNumber = typeof existingSiqs === 'number' ? 
            existingSiqs : 
            (typeof existingSiqs === 'object' && existingSiqs && 'score' in existingSiqs) ? 
            existingSiqs.score : 0;
            
          if (existingSiqsNumber > 0 && onSiqsCalculated) {
            onSiqsCalculated(existingSiqsNumber, false, 5);
          } else if (onSiqsCalculated) {
            onSiqsCalculated(null, false);
          }
        } else if (onSiqsCalculated) {
          onSiqsCalculated(null, false);
        }
      }
      
      setLastCalculatedCoords(coordsKey);
    } catch (error) {
      console.error("Error calculating SIQS:", error);
      // Use existing SIQS if available as fallback after error
      if (existingSiqs) {
        const existingSiqsNumber = typeof existingSiqs === 'number' ? 
          existingSiqs : 
          (typeof existingSiqs === 'object' && existingSiqs && 'score' in existingSiqs) ? 
          existingSiqs.score : 0;
          
        if (existingSiqsNumber > 0 && onSiqsCalculated) {
          onSiqsCalculated(existingSiqsNumber, false, 5);
        } else if (onSiqsCalculated) {
          onSiqsCalculated(null, false);
        }
      } else if (onSiqsCalculated) {
        onSiqsCalculated(null, false);
      }
    } finally {
      setLoading(false);
      setHasAttemptedCalculation(true);
    }
  }, [latitude, longitude, isVisible, forceUpdate, lastCalculatedCoords, calculatedSiqs, onSiqsCalculated, bortleScale, isCertified, isDarkSkyReserve, existingSiqs]);
  
  // Calculate on mount or when dependencies change
  useEffect(() => {
    if (forceUpdate || !hasAttemptedCalculation || lastCalculatedCoords !== `${latitude.toFixed(4)},${longitude.toFixed(4)}`) {
      const timeoutId = setTimeout(() => {
        calculateSiqsValue();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [latitude, longitude, forceUpdate, hasAttemptedCalculation, lastCalculatedCoords, calculateSiqsValue]);
  
  // Always notify parent of loading state
  useEffect(() => {
    if (onSiqsCalculated) {
      onSiqsCalculated(calculatedSiqs, loading, siqsConfidence);
    }
  }, [onSiqsCalculated, loading, calculatedSiqs, siqsConfidence]);
  
  return null;
};

export default React.memo(RealTimeSiqsProvider);
