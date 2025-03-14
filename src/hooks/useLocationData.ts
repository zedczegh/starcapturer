
import { useState, useEffect, useCallback } from 'react';

/**
 * Optimized location data cache hook with improved memory usage and performance
 */
export const useLocationDataCache = () => {
  // Use a global cache for better performance
  const globalCache = useState<Map<string, { data: any; timestamp: number }>>(
    () => new Map()
  )[0];
  
  // Clear expired cache items periodically 
  useEffect(() => {
    const intervalId = setInterval(() => {
      const now = Date.now();
      const expiryTime = 24 * 60 * 60 * 1000; // 24 hours
      
      for (const [key, item] of globalCache.entries()) {
        if (now - item.timestamp > expiryTime) {
          globalCache.delete(key);
        }
      }
    }, 60 * 60 * 1000); // Run cleanup hourly
    
    return () => clearInterval(intervalId);
  }, [globalCache]);
  
  // Efficient cache retrieval function
  const getCachedData = useCallback((key: string, maxAge: number = 30 * 60 * 1000) => {
    const cachedItem = globalCache.get(key);
    
    if (!cachedItem) {
      // Try localStorage as fallback
      try {
        const storedItem = localStorage.getItem(key);
        if (storedItem) {
          const parsedData = JSON.parse(storedItem);
          // Add to memory cache for faster future access
          globalCache.set(key, { data: parsedData, timestamp: Date.now() });
          return parsedData;
        }
      } catch (e) {
        console.error("Error retrieving from localStorage:", e);
      }
      return null;
    }
    
    // Check if data is expired
    if (Date.now() - cachedItem.timestamp > maxAge) {
      return null;
    }
    
    return cachedItem.data;
  }, [globalCache]);
  
  // Cache data with current timestamp
  const setCachedData = useCallback((key: string, data: any) => {
    const timestamp = Date.now();
    
    // Update memory cache
    globalCache.set(key, { data, timestamp });
    
    // Also store in localStorage for persistence
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error("Error storing in localStorage:", e);
    }
  }, [globalCache]);
  
  // Clear cache items
  const clearCache = useCallback((keys?: string[]) => {
    if (keys && Array.isArray(keys)) {
      // Clear specific keys
      for (const key of keys) {
        globalCache.delete(key);
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.error("Error removing from localStorage:", e);
        }
      }
    } else {
      // Clear all cache
      globalCache.clear();
      
      try {
        // Only clear our app-specific keys
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
  }, [globalCache]);
  
  return { getCachedData, setCachedData, clearCache };
};

// Export any other necessary functions
export * from './location/useLocationCache';
