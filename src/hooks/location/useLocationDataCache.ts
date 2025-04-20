
import { useState, useEffect, useCallback } from "react";

// Define the cache expiration time in milliseconds (default: 30 minutes)
const DEFAULT_CACHE_EXPIRATION = 30 * 60 * 1000;

// Cache storage with memory optimization
const GLOBAL_CACHE = new Map<string, { data: any; timestamp: number }>();

interface CachedItem<T> {
  data: T;
  timestamp: number;
}

/**
 * Custom hook for managing location data cache with efficient memory usage
 */
const useLocationCache = () => {
  // Initialize cache state
  const [cache, setCache] = useState<Record<string, CachedItem<any>>>({});
  
  // Sync with global cache on mount
  useEffect(() => {
    const initialCache: Record<string, CachedItem<any>> = {};
    GLOBAL_CACHE.forEach((value, key) => {
      initialCache[key] = value;
    });
    setCache(initialCache);
  }, []);
  
  // Clear expired items from cache periodically
  useEffect(() => {
    const cleanup = () => {
      const now = Date.now();
      let hasChanges = false;
      
      // Remove expired items from global cache
      GLOBAL_CACHE.forEach((value, key) => {
        if (now - value.timestamp > 24 * 60 * 60 * 1000) {
          GLOBAL_CACHE.delete(key);
          hasChanges = true;
        }
      });
      
      if (hasChanges) {
        // Update local state if global cache changed
        const updatedCache: Record<string, CachedItem<any>> = {};
        GLOBAL_CACHE.forEach((value, key) => {
          updatedCache[key] = value;
        });
        setCache(updatedCache);
      }
    };
    
    // Run cleanup every 5 minutes
    const interval = setInterval(cleanup, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Function to get data from cache with expiration check
  const getCachedData = useCallback((key: string, maxAge: number = DEFAULT_CACHE_EXPIRATION) => {
    // First try global cache (fastest)
    const globalCachedItem = GLOBAL_CACHE.get(key);
    
    if (globalCachedItem) {
      // Check if the cached data has expired
      if (Date.now() - globalCachedItem.timestamp <= maxAge) {
        return globalCachedItem.data;
      }
      return null;
    }
    
    // Fall back to component cache
    const cachedItem = cache[key];
    
    if (!cachedItem) {
      // Try localStorage as a fallback
      try {
        const storedValue = localStorage.getItem(key);
        if (storedValue) {
          try {
            const parsedData = JSON.parse(storedValue);
            const timestamp = Date.now(); // Assume it's fresh when pulled from localStorage
            
            // Store in global and memory cache for faster future access
            const newCacheItem = { data: parsedData, timestamp };
            GLOBAL_CACHE.set(key, newCacheItem);
            
            setCache(prev => ({
              ...prev,
              [key]: newCacheItem
            }));
            
            return parsedData;
          } catch (e) {
            console.error("Error parsing localStorage data:", e);
          }
        }
      } catch (e) {
        console.error("Error accessing localStorage:", e);
      }
      
      return null;
    }
    
    // Check if the cached data has expired
    if (Date.now() - cachedItem.timestamp > maxAge) {
      return null;
    }
    
    return cachedItem.data;
  }, [cache]);
  
  // Function to cache data with current timestamp
  const setCachedData = useCallback((key: string, data: any) => {
    const timestamp = Date.now();
    const newCacheItem = { data, timestamp };
    
    // Update global cache first (fastest access)
    GLOBAL_CACHE.set(key, newCacheItem);
    
    setCache(prev => ({
      ...prev,
      [key]: newCacheItem
    }));
    
    // Also store in localStorage as a backup
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error("Error storing data in localStorage:", e);
    }
  }, []);
  
  // Clear specific items or entire cache
  const clearCache = useCallback((keys?: string[]) => {
    if (keys && Array.isArray(keys)) {
      keys.forEach(key => {
        GLOBAL_CACHE.delete(key);
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.error("Error removing item from localStorage:", e);
        }
      });
      
      setCache(prev => {
        const newCache = { ...prev };
        keys.forEach(key => {
          delete newCache[key];
        });
        return newCache;
      });
    } else {
      // Clear entire cache
      GLOBAL_CACHE.clear();
      setCache({});
      
      try {
        // Only clear our cache keys, not all localStorage
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (
            key.startsWith('weather-') || 
            key.startsWith('bortle-') || 
            key.startsWith('forecast-') || 
            key.startsWith('location_')
          )) {
            localStorage.removeItem(key);
          }
        }
      } catch (e) {
        console.error("Error clearing localStorage:", e);
      }
    }
  }, []);
  
  return { getCachedData, setCachedData, clearCache };
};

export default useLocationCache;
