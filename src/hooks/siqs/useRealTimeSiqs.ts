
import { useState, useCallback, useRef, useEffect } from 'react';
import { calculateRealTimeSiqs } from '@/services/realTimeSiqs/siqsCalculator';
import { hasCachedSiqs, getCachedSiqs } from '@/services/realTimeSiqs/siqsCache';

interface UseRealTimeSiqsOptions {
  skipCache?: boolean;
  refreshInterval?: number;
  includeMetadata?: boolean;
  priority?: number; // Priority from 1-10, higher = more important
}

// Global memory cache to reduce redundant calculations
const memoryCache = new Map<string, {
  siqs: number;
  timestamp: number;
  promise?: Promise<any>;
}>();

// Queue for managing simultaneous calculations
const calculationQueue = new Map<string, {
  promise: Promise<any>;
  priority: number;
  timestamp: number;
}>();

// Configuration
const MEMORY_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MAX_CONCURRENT_CALCULATIONS = 4;

export function useRealTimeSiqs(options: UseRealTimeSiqsOptions = {}) {
  const [loading, setLoading] = useState(false);
  const [siqsScore, setSiqsScore] = useState<number | null>(null);
  const lastCalculationRef = useRef<number>(0);
  const calculationPromiseRef = useRef<Promise<any> | null>(null);
  const mountedRef = useRef<boolean>(true);

  // Set mounted status for safe state updates
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Process calculation queue periodically
  useEffect(() => {
    const processQueueInterval = setInterval(() => {
      // Process highest priority calculations first
      if (calculationQueue.size > 0 && getActiveCalculations() < MAX_CONCURRENT_CALCULATIONS) {
        const sortedEntries = [...calculationQueue.entries()]
          .sort((a, b) => {
            // Sort by priority first, then by timestamp
            if (b[1].priority !== a[1].priority) {
              return b[1].priority - a[1].priority;
            }
            return a[1].timestamp - b[1].timestamp;
          });
        
        // Process the highest priority entry
        if (sortedEntries.length > 0) {
          // We don't need to do anything here, the promise is already executing
          // This is just queue management to ensure high priority items get processed
        }
      }
    }, 250);
    
    return () => clearInterval(processQueueInterval);
  }, []);

  // Clean memory cache periodically
  const cleanMemoryCache = useCallback(() => {
    const now = Date.now();
    const expiredKeys = [];
    
    // Find expired entries
    for (const [key, value] of memoryCache.entries()) {
      if (now - value.timestamp > MEMORY_CACHE_DURATION) {
        expiredKeys.push(key);
      }
    }
    
    // Remove expired entries
    for (const key of expiredKeys) {
      memoryCache.delete(key);
    }
    
    // Cleanup calculation queue
    const expiredCalculations = [];
    for (const [key, value] of calculationQueue.entries()) {
      if (now - value.timestamp > 60000) { // 1 minute timeout
        expiredCalculations.push(key);
      }
    }
    
    for (const key of expiredCalculations) {
      calculationQueue.delete(key);
    }
  }, []);

  // Get number of active calculations
  function getActiveCalculations(): number {
    let active = 0;
    const now = Date.now();
    
    for (const [_, value] of calculationQueue.entries()) {
      // Only count recent calculations (last 10 seconds) as active
      if (now - value.timestamp < 10000) {
        active++;
      }
    }
    
    return active;
  }

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
          if (mountedRef.current) setLoading(true);
          return cached.promise.then(result => {
            if (result && result.siqs > 0 && mountedRef.current) {
              setSiqsScore(result.siqs);
              memoryCache.set(cacheKey, {
                siqs: result.siqs,
                timestamp: now
              });
            }
            if (mountedRef.current) setLoading(false);
            return result;
          }).catch(error => {
            if (mountedRef.current) setLoading(false);
            console.error("Error in shared SIQS calculation:", error);
            return null;
          });
        }

        // If we have a valid cached value, use it
        if (cached.siqs && now - cached.timestamp < MEMORY_CACHE_DURATION) {
          if (mountedRef.current) setSiqsScore(cached.siqs);
          return { siqs: cached.siqs };
        }
      }
    }
    
    // Check persistent cache
    if (!options.skipCache && hasCachedSiqs(latitude, longitude)) {
      const cached = getCachedSiqs(latitude, longitude);
      if (cached && cached.siqs > 0) {
        if (mountedRef.current) setSiqsScore(cached.siqs);
        
        // Update memory cache
        memoryCache.set(cacheKey, {
          siqs: cached.siqs,
          timestamp: now
        });
        
        return cached;
      }
    }

    // Prevent duplicate calculations within a short period
    if (now - lastCalculationRef.current < 2000) {
      return null;
    }

    if (mountedRef.current) setLoading(true);
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
      
      // Add to calculation queue with priority
      calculationQueue.set(cacheKey, {
        promise: calculationPromise,
        priority: options.priority || 1,
        timestamp: now
      });
      
      // Store the pending calculation in memory cache too
      memoryCache.set(cacheKey, {
        siqs: 0,
        timestamp: now,
        promise: calculationPromise
      });

      const result = await calculationPromise;
      
      if (result && result.siqs > 0 && mountedRef.current) {
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
      if (mountedRef.current) setLoading(false);
      calculationPromiseRef.current = null;
      calculationQueue.delete(cacheKey);
      
      // Clean up the promise from memory cache
      const existingCache = memoryCache.get(cacheKey);
      if (existingCache && existingCache.promise) {
        existingCache.promise = undefined;
        memoryCache.set(cacheKey, existingCache);
      }
    }
  }, [options.skipCache, options.includeMetadata, options.priority, cleanMemoryCache]);

  return {
    siqsScore,
    loading,
    calculateSiqs,
    clearScore: () => mountedRef.current && setSiqsScore(null)
  };
}
