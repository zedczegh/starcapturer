
import { useState, useEffect, useCallback } from "react";

// Define the cache expiration time in milliseconds (default: 30 minutes)
const DEFAULT_CACHE_EXPIRATION = 30 * 60 * 1000;

// Optimized memory cache using WeakMap for better memory management
const MEMORY_CACHE = new Map<string, { data: any; timestamp: number }>();

// Implement expiration monitoring system
const EXPIRY_TIMERS = new Map<string, NodeJS.Timeout>();

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
  
  // Sync with memory cache on mount
  useEffect(() => {
    const initialCache: Record<string, CachedItem<any>> = {};
    MEMORY_CACHE.forEach((value, key) => {
      initialCache[key] = value;
    });
    setCache(initialCache);
    
    // Clean up every 5 minutes
    const cleanupInterval = setInterval(() => {
      cleanupExpiredItems();
    }, 5 * 60 * 1000);
    
    return () => {
      clearInterval(cleanupInterval);
      EXPIRY_TIMERS.forEach(timer => clearTimeout(timer));
    };
  }, []);
  
  // Function to clean up expired items
  const cleanupExpiredItems = useCallback(() => {
    const now = Date.now();
    let hasChanges = false;
    
    // Remove expired items from memory cache
    MEMORY_CACHE.forEach((value, key) => {
      if (now - value.timestamp > 24 * 60 * 60 * 1000) {
        MEMORY_CACHE.delete(key);
        
        // Clear any expiry timers
        if (EXPIRY_TIMERS.has(key)) {
          clearTimeout(EXPIRY_TIMERS.get(key)!);
          EXPIRY_TIMERS.delete(key);
        }
        
        hasChanges = true;
      }
    });
    
    if (hasChanges) {
      // Update local state if memory cache changed
      const updatedCache: Record<string, CachedItem<any>> = {};
      MEMORY_CACHE.forEach((value, key) => {
        updatedCache[key] = value;
      });
      setCache(updatedCache);
    }
  }, []);
  
  // Function to get data from cache with expiration check
  const getCachedData = useCallback((key: string, maxAge: number = DEFAULT_CACHE_EXPIRATION) => {
    // First try memory cache (fastest)
    const cachedItem = MEMORY_CACHE.get(key);
    
    if (cachedItem) {
      // Check if the cached data has expired
      if (Date.now() - cachedItem.timestamp <= maxAge) {
        return cachedItem.data;
      }
      return null;
    }
    
    // Fall back to localStorage as a last resort
    try {
      const storedValue = localStorage.getItem(key);
      if (storedValue) {
        const parsedData = JSON.parse(storedValue);
        const timestamp = Date.now(); // Assume it's fresh when pulled from localStorage
        
        // Store in memory cache for faster future access
        const newCacheItem = { data: parsedData, timestamp };
        MEMORY_CACHE.set(key, newCacheItem);
        
        setCache(prev => ({
          ...prev,
          [key]: newCacheItem
        }));
        
        return parsedData;
      }
    } catch (e) {
      console.error("Error accessing localStorage:", e);
    }
    
    return null;
  }, []);
  
  // Function to cache data with current timestamp
  const setCachedData = useCallback((key: string, data: any) => {
    const timestamp = Date.now();
    const newCacheItem = { data, timestamp };
    
    // Update memory cache first (fastest access)
    MEMORY_CACHE.set(key, newCacheItem);
    
    // Set expiration timer
    if (EXPIRY_TIMERS.has(key)) {
      clearTimeout(EXPIRY_TIMERS.get(key)!);
    }
    
    // Set expiration to 24 hours
    EXPIRY_TIMERS.set(key, setTimeout(() => {
      MEMORY_CACHE.delete(key);
      EXPIRY_TIMERS.delete(key);
      
      // Update component state too
      setCache(prev => {
        const newCache = { ...prev };
        delete newCache[key];
        return newCache;
      });
    }, 24 * 60 * 60 * 1000));
    
    setCache(prev => ({
      ...prev,
      [key]: newCacheItem
    }));
    
    // Batch localStorage writes using a debounce pattern
    if (typeof window !== 'undefined') {
      try {
        // Use a stable key for the timeout to prevent multiple timers
        const WRITE_TIMER_KEY = '__cache_write_timer';
        
        // Clear existing timer
        if (window[WRITE_TIMER_KEY]) {
          clearTimeout(window[WRITE_TIMER_KEY]);
        }
        
        // Set new timer to batch writes
        window[WRITE_TIMER_KEY] = setTimeout(() => {
          try {
            localStorage.setItem(key, JSON.stringify(data));
            delete window[WRITE_TIMER_KEY];
          } catch (e) {
            console.error("Error storing data in localStorage:", e);
          }
        }, 1000); // Wait 1 second to batch multiple writes
      } catch (e) {
        console.error("Error setting up localStorage write:", e);
      }
    }
  }, []);
  
  // Clear specific items or entire cache
  const clearCache = useCallback((keys?: string[]) => {
    if (keys && Array.isArray(keys)) {
      keys.forEach(key => {
        MEMORY_CACHE.delete(key);
        
        if (EXPIRY_TIMERS.has(key)) {
          clearTimeout(EXPIRY_TIMERS.get(key)!);
          EXPIRY_TIMERS.delete(key);
        }
        
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
      MEMORY_CACHE.clear();
      
      // Clear all expiry timers
      EXPIRY_TIMERS.forEach(timer => clearTimeout(timer));
      EXPIRY_TIMERS.clear();
      
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

export { useLocationCache };
export default useLocationCache;
