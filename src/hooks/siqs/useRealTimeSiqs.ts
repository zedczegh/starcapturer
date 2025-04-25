
import { useState, useCallback, useRef } from 'react';
import { calculateRealTimeSiqs } from '@/services/realTimeSiqs/siqsCalculator';
import { hasCachedSiqs, getCachedSiqs } from '@/services/realTimeSiqs/siqsCache';

interface UseRealTimeSiqsOptions {
  skipCache?: boolean;
  refreshInterval?: number;
  includeMetadata?: boolean;
}

// Global memory cache to reduce redundant calculations
const memoryCache = new Map<string, {
  siqs: number;
  timestamp: number;
  promise?: Promise<any>;
}>();

const MEMORY_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useRealTimeSiqs(options: UseRealTimeSiqsOptions = {}) {
  const [loading, setLoading] = useState(false);
  const [siqsScore, setSiqsScore] = useState<number | null>(null);
  const lastCalculationRef = useRef<number>(0);
  const calculationPromiseRef = useRef<Promise<any> | null>(null);

  // Clean memory cache periodically
  const cleanMemoryCache = useCallback(() => {
    const now = Date.now();
    for (const [key, value] of memoryCache.entries()) {
      if (now - value.timestamp > MEMORY_CACHE_DURATION) {
        memoryCache.delete(key);
      }
    }
  }, []);

  const calculateSiqs = useCallback(async (
    latitude: number,
    longitude: number,
    bortleScale: number = 4
  ) => {
    // Skip if a calculation is in progress for this instance
    if (calculationPromiseRef.current) {
      return calculationPromiseRef.current;
    }

    const now = Date.now();
    const cacheKey = `${latitude.toFixed(3)}-${longitude.toFixed(3)}-${bortleScale}`;

    // Check memory cache first (fastest)
    if (!options.skipCache) {
      cleanMemoryCache();
      const cached = memoryCache.get(cacheKey);
      
      if (cached) {
        // If another calculation is in progress, reuse its promise
        if (cached.promise && !cached.siqs) {
          setLoading(true);
          return cached.promise.then(result => {
            if (result && result.siqs > 0) {
              setSiqsScore(result.siqs);
              memoryCache.set(cacheKey, {
                siqs: result.siqs,
                timestamp: now
              });
            }
            setLoading(false);
            return result;
          }).catch(error => {
            setLoading(false);
            console.error("Error in shared SIQS calculation:", error);
            return null;
          });
        }

        // If we have a valid cached value, use it
        if (cached.siqs && now - cached.timestamp < MEMORY_CACHE_DURATION) {
          setSiqsScore(cached.siqs);
          return { siqs: cached.siqs };
        }
      }
    }
    
    // Check persistent cache
    if (!options.skipCache && hasCachedSiqs(latitude, longitude)) {
      const cached = getCachedSiqs(latitude, longitude);
      if (cached && cached.siqs > 0) {
        setSiqsScore(cached.siqs);
        
        // Update memory cache
        memoryCache.set(cacheKey, {
          siqs: cached.siqs,
          timestamp: now
        });
        
        return cached;
      }
    }

    // Prevent duplicate calculations within a short period
    if (now - lastCalculationRef.current < 3000) {
      return null;
    }

    setLoading(true);
    lastCalculationRef.current = now;

    try {
      // Create calculation promise
      const calculationPromise = calculateRealTimeSiqs(
        latitude,
        longitude,
        bortleScale,
        {
          useSingleHourSampling: true,
          targetHour: 1,
          cacheDurationMins: 5
        }
      );
      
      // Store the promise in refs and memory cache
      calculationPromiseRef.current = calculationPromise;
      
      // Store the pending calculation in memory cache too, so other components can reuse it
      memoryCache.set(cacheKey, {
        siqs: 0,
        timestamp: now,
        promise: calculationPromise
      });

      const result = await calculationPromise;
      
      if (result && result.siqs > 0) {
        setSiqsScore(result.siqs);
        
        // Update memory cache with result
        memoryCache.set(cacheKey, {
          siqs: result.siqs,
          timestamp: now
        });
      }
      
      return options.includeMetadata ? result : result?.siqs;
    } catch (error) {
      console.error("Error calculating SIQS:", error);
      return null;
    } finally {
      setLoading(false);
      calculationPromiseRef.current = null;
      
      // Clean up the promise from memory cache
      const existingCache = memoryCache.get(cacheKey);
      if (existingCache && existingCache.promise) {
        existingCache.promise = undefined;
        memoryCache.set(cacheKey, existingCache);
      }
    }
  }, [options.skipCache, options.includeMetadata, cleanMemoryCache]);

  return {
    siqsScore,
    loading,
    calculateSiqs,
    clearScore: () => setSiqsScore(null)
  };
}
