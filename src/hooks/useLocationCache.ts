
import { useState, useCallback, useMemo, useEffect } from 'react';

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

/**
 * Custom hook for caching location data to reduce API calls and improve performance
 */
const useLocationCache = <T,>() => {
  // Try to load initial cache from localStorage for persistence across sessions
  const getInitialCache = (): Record<string, CacheItem<T>> => {
    if (typeof window === 'undefined') return {};
    
    try {
      const savedCache = localStorage.getItem('location_cache');
      if (!savedCache) return {};
      
      const parsed = JSON.parse(savedCache);
      
      // Clear expired items on initialization
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      
      const cleanedCache: Record<string, CacheItem<T>> = {};
      Object.entries(parsed).forEach(([key, value]: [string, any]) => {
        if (now - value.timestamp < oneDay) {
          cleanedCache[key] = value as CacheItem<T>;
        }
      });
      
      return cleanedCache;
    } catch (e) {
      console.error("Error loading cache from localStorage:", e);
      return {};
    }
  };
  
  const [cache, setCache] = useState<Record<string, CacheItem<T>>>(getInitialCache);
  
  // Periodically clean up expired cache items
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      setCache(prevCache => {
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        const newCache: Record<string, CacheItem<T>> = {};
        let hasChanges = false;
        
        Object.entries(prevCache).forEach(([key, item]) => {
          if (now - item.timestamp < oneDay) {
            newCache[key] = item;
          } else {
            hasChanges = true;
          }
        });
        
        if (hasChanges) {
          try {
            localStorage.setItem('location_cache', JSON.stringify(newCache));
          } catch (e) {
            console.error("Error saving cache to localStorage during cleanup:", e);
          }
          return newCache;
        }
        return prevCache;
      });
    }, 60 * 60 * 1000); // Run cleanup every hour
    
    return () => clearInterval(cleanupInterval);
  }, []);
  
  // Store data in cache with timestamp and persist to localStorage
  const setCachedData = useCallback((key: string, data: T) => {
    if (!key || data === undefined) return;
    
    const newCacheItem = {
      data,
      timestamp: Date.now()
    };
    
    setCache(prev => {
      const newCache = {
        ...prev,
        [key]: newCacheItem
      };
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('location_cache', JSON.stringify(newCache));
        } catch (e) {
          console.error("Error saving cache to localStorage:", e);
        }
      }
      
      return newCache;
    });
  }, []);
  
  // Get data from cache if it exists and is not expired
  const getCachedData = useCallback((key: string, maxAge = 5 * 60 * 1000) => {
    if (!key) return null;
    
    const cached = cache[key];
    if (!cached) return null;
    
    const age = Date.now() - cached.timestamp;
    if (age > maxAge) return null;
    
    return cached.data;
  }, [cache]);
  
  // Clear all cached data
  const clearCache = useCallback(() => {
    setCache({});
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('location_cache');
      } catch (e) {
        console.error("Error clearing cache in localStorage:", e);
      }
    }
  }, []);
  
  // Clear specific key from cache
  const clearCacheItem = useCallback((key: string) => {
    if (!key) return;
    
    setCache(prev => {
      const newCache = { ...prev };
      if (!newCache[key]) return prev;
      
      delete newCache[key];
      
      // Update localStorage
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('location_cache', JSON.stringify(newCache));
        } catch (e) {
          console.error("Error updating cache in localStorage:", e);
        }
      }
      
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
