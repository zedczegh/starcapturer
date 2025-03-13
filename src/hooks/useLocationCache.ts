
import { useState, useCallback, useMemo } from 'react';

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

/**
 * Custom hook for caching location data to reduce API calls and improve performance
 */
const useLocationCache = <T,>() => {
  const [cache, setCache] = useState<Record<string, CacheItem<T>>>({});
  
  // Store data in cache with timestamp
  const setCachedData = useCallback((key: string, data: T) => {
    setCache(prev => ({
      ...prev,
      [key]: {
        data,
        timestamp: Date.now()
      }
    }));
  }, []);
  
  // Get data from cache if it exists and is not expired
  const getCachedData = useCallback((key: string, maxAge = 5 * 60 * 1000) => {
    const cached = cache[key];
    if (!cached) return null;
    
    const age = Date.now() - cached.timestamp;
    if (age > maxAge) return null;
    
    return cached.data;
  }, [cache]);
  
  // Clear all cached data
  const clearCache = useCallback(() => {
    setCache({});
  }, []);
  
  // Clear specific key from cache
  const clearCacheItem = useCallback((key: string) => {
    setCache(prev => {
      const newCache = { ...prev };
      delete newCache[key];
      return newCache;
    });
  }, []);
  
  // Memoize the returned object to prevent unnecessary rerenders
  return useMemo(() => ({ 
    setCachedData, 
    getCachedData, 
    clearCache,
    clearCacheItem
  }), [setCachedData, getCachedData, clearCache, clearCacheItem]);
};

export default useLocationCache;
