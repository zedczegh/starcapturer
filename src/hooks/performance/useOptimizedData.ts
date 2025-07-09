import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { debounce, throttle, globalAPIBatcher } from '@/utils/performanceOptimizer';
import { getCachedItem, setCachedItem } from '@/utils/optimizedCache';

interface UseOptimizedDataOptions<T> {
  cacheKey?: string;
  cacheTTL?: number;
  debounceMs?: number;
  throttleMs?: number;
  batchKey?: string;
  dependencies?: any[];
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

/**
 * Optimized data fetching hook with caching, debouncing, and batching
 */
export function useOptimizedData<T>(
  fetcher: (...args: any[]) => Promise<T>,
  fetcherArgs: any[] = [],
  options: UseOptimizedDataOptions<T> = {}
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  clearCache: () => void;
} {
  const {
    cacheKey,
    cacheTTL = 5 * 60 * 1000, // 5 minutes
    debounceMs = 0,
    throttleMs = 0,
    batchKey,
    dependencies = [],
    onSuccess,
    onError
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isMountedRef = useRef(true);
  const lastFetchArgsRef = useRef<string>('');

  // Check cache first
  useEffect(() => {
    if (cacheKey) {
      const cachedData = getCachedItem<T>(cacheKey);
      if (cachedData) {
        setData(cachedData);
        onSuccess?.(cachedData);
      }
    }
  }, [cacheKey, onSuccess]);

  // Create optimized fetch function
  const optimizedFetch = useMemo(() => {
    let fetchFn = async () => {
      if (!isMountedRef.current) return;

      const argsKey = JSON.stringify(fetcherArgs);
      if (argsKey === lastFetchArgsRef.current && data) {
        return; // Same args, skip refetch
      }
      lastFetchArgsRef.current = argsKey;

      try {
        setLoading(true);
        setError(null);

        let result: T;
        if (batchKey) {
          result = await globalAPIBatcher.batch(batchKey, fetcher, ...fetcherArgs);
        } else {
          result = await fetcher(...fetcherArgs);
        }

        if (!isMountedRef.current) return;

        setData(result);
        setError(null);
        onSuccess?.(result);

        // Cache the result
        if (cacheKey) {
          setCachedItem(cacheKey, result, cacheTTL);
        }
      } catch (err) {
        if (!isMountedRef.current) return;
        
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onError?.(error);
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    // Apply debouncing if specified
    if (debounceMs > 0) {
      const debouncedFn = debounce(fetchFn, debounceMs);
      fetchFn = () => {
        debouncedFn();
        return Promise.resolve();
      };
    }

    // Apply throttling if specified
    if (throttleMs > 0) {
      const throttledFn = throttle(fetchFn, throttleMs);
      fetchFn = () => {
        throttledFn();
        return Promise.resolve();
      };
    }

    return fetchFn;
  }, [fetcher, fetcherArgs, batchKey, cacheKey, cacheTTL, debounceMs, throttleMs, onSuccess, onError, data]);

  // Trigger fetch when dependencies change
  useEffect(() => {
    optimizedFetch();
  }, [...dependencies, optimizedFetch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const refetch = useCallback(async () => {
    lastFetchArgsRef.current = ''; // Reset to force refetch
    return optimizedFetch();
  }, [optimizedFetch]);

  const clearCache = useCallback(() => {
    if (cacheKey) {
      setCachedItem(cacheKey, null, 0); // Immediately expire
    }
    return Promise.resolve();
  }, [cacheKey]);

  return {
    data,
    loading,
    error,
    refetch,
    clearCache
  };
}

/**
 * Optimized location data hook with smart caching
 */
export function useOptimizedLocationData(
  latitude: number | null,
  longitude: number | null,
  options: Omit<UseOptimizedDataOptions<any>, 'cacheKey'> = {}
) {
  const cacheKey = latitude && longitude 
    ? `location-${latitude.toFixed(4)}-${longitude.toFixed(4)}`
    : undefined;

  return useOptimizedData(
    async (lat: number, lng: number) => {
      // This would be your actual location data fetcher
      // For now, return a placeholder
      return { latitude: lat, longitude: lng };
    },
    latitude && longitude ? [latitude, longitude] : [],
    {
      ...options,
      cacheKey,
      debounceMs: 300, // Debounce location changes
      dependencies: [latitude, longitude]
    }
  );
}

/**
 * Optimized SIQS calculation hook
 */
export function useOptimizedSIQS(
  latitude: number | null,
  longitude: number | null,
  bortleScale: number | null,
  options: Omit<UseOptimizedDataOptions<any>, 'cacheKey' | 'batchKey'> = {}
) {
  const cacheKey = latitude && longitude && bortleScale
    ? `siqs-${latitude.toFixed(4)}-${longitude.toFixed(4)}-${bortleScale.toFixed(1)}`
    : undefined;

  return useOptimizedData(
    async (lat: number, lng: number, bortle: number) => {
      const { calculateRealTimeSiqs } = await import('@/services/realTimeSiqs/siqsCalculator');
      return calculateRealTimeSiqs(lat, lng, bortle, {
        useSingleHourSampling: true,
        cacheDurationMins: 15
      });
    },
    latitude && longitude && bortleScale ? [latitude, longitude, bortleScale] : [],
    {
      ...options,
      cacheKey,
      batchKey: 'siqs-batch',
      debounceMs: 500, // Debounce SIQS calculations
      dependencies: [latitude, longitude, bortleScale]
    }
  );
}