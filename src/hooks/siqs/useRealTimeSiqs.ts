
import { useState, useCallback, useRef } from 'react';
import { calculateRealTimeSiqs } from '@/services/realTimeSiqs/siqsCalculator';
import { hasCachedSiqs, getCachedSiqs } from '@/services/realTimeSiqs/siqsCache';

interface UseRealTimeSiqsOptions {
  skipCache?: boolean;
  refreshInterval?: number;
  includeMetadata?: boolean;
}

export function useRealTimeSiqs(options: UseRealTimeSiqsOptions = {}) {
  const [loading, setLoading] = useState(false);
  const [siqsScore, setSiqsScore] = useState<number | null>(null);
  const lastCalculationRef = useRef<number>(0);
  const calculationPromiseRef = useRef<Promise<any> | null>(null);

  const calculateSiqs = useCallback(async (
    latitude: number,
    longitude: number,
    bortleScale: number = 4
  ) => {
    // Skip if a calculation is in progress
    if (calculationPromiseRef.current) {
      return calculationPromiseRef.current;
    }

    const now = Date.now();
    // Check cache first unless skipCache is true
    if (!options.skipCache && hasCachedSiqs(latitude, longitude)) {
      const cached = getCachedSiqs(latitude, longitude);
      if (cached && cached.siqs > 0) {
        setSiqsScore(cached.siqs);
        return cached;
      }
    }

    // Prevent duplicate calculations within 5 seconds
    if (now - lastCalculationRef.current < 5000) {
      return null;
    }

    setLoading(true);
    lastCalculationRef.current = now;

    try {
      calculationPromiseRef.current = calculateRealTimeSiqs(
        latitude,
        longitude,
        bortleScale,
        {
          useSingleHourSampling: true,
          targetHour: 1,
          cacheDurationMins: 5
        }
      );

      const result = await calculationPromiseRef.current;
      
      if (result && result.siqs > 0) {
        setSiqsScore(result.siqs);
      }
      
      return options.includeMetadata ? result : result?.siqs;
    } catch (error) {
      console.error("Error calculating SIQS:", error);
      return null;
    } finally {
      setLoading(false);
      calculationPromiseRef.current = null;
    }
  }, [options.skipCache, options.includeMetadata]);

  return {
    siqsScore,
    loading,
    calculateSiqs,
    clearScore: () => setSiqsScore(null)
  };
}
