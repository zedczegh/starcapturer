
import { useState, useEffect, useCallback } from "react";

// Define the cache expiration time in milliseconds (default: 30 minutes)
const DEFAULT_CACHE_EXPIRATION = 30 * 60 * 1000;

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
  
  // Clear expired items from cache periodically
  useEffect(() => {
    const cleanup = () => {
      const now = Date.now();
      setCache(currentCache => {
        const updatedCache = { ...currentCache };
        let hasChanges = false;
        
        // Remove expired items
        Object.keys(updatedCache).forEach(key => {
          // Remove items older than 24 hours regardless of usage
          if (now - updatedCache[key].timestamp > 24 * 60 * 60 * 1000) {
            delete updatedCache[key];
            hasChanges = true;
          }
        });
        
        return hasChanges ? updatedCache : currentCache;
      });
    };
    
    // Run cleanup every 5 minutes
    const interval = setInterval(cleanup, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Function to get data from cache with expiration check
  const getCachedData = useCallback((key: string, maxAge: number = DEFAULT_CACHE_EXPIRATION) => {
    const cachedItem = cache[key];
    
    if (!cachedItem) {
      // Try localStorage as a fallback
      try {
        const storedValue = localStorage.getItem(key);
        if (storedValue) {
          try {
            const parsedData = JSON.parse(storedValue);
            const timestamp = Date.now(); // Assume it's fresh when pulled from localStorage
            
            // Store in memory cache for faster future access
            setCache(prev => ({
              ...prev,
              [key]: { data: parsedData, timestamp }
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
    
    setCache(prev => ({
      ...prev,
      [key]: { data, timestamp }
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
      setCache(prev => {
        const newCache = { ...prev };
        keys.forEach(key => {
          delete newCache[key];
          try {
            localStorage.removeItem(key);
          } catch (e) {
            console.error("Error removing item from localStorage:", e);
          }
        });
        return newCache;
      });
    } else {
      // Clear entire cache
      setCache({});
      try {
        // Only clear our cache keys, not all localStorage
        Object.keys(cache).forEach(key => {
          localStorage.removeItem(key);
        });
      } catch (e) {
        console.error("Error clearing localStorage:", e);
      }
    }
  }, [cache]);
  
  return { getCachedData, setCachedData, clearCache };
};

export default useLocationCache;
