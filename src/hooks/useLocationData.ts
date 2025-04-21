
import { useState, useEffect, useCallback } from 'react';

// Create a module-level variable for the in-memory cache that persists across renders
// But don't use useState outside of a component/hook context
const globalCacheMap = new Map<string, { data: any; timestamp: number }>();

/**
 * Optimized location data cache hook with improved memory usage and performance
 */
export const useLocationDataCache = () => {
  // Use useState within the hook function context
  const [, setRefreshTrigger] = useState<number>(0);
  
  // Clear expired cache items periodically 
  useEffect(() => {
    const intervalId = setInterval(() => {
      const now = Date.now();
      const expiryTime = 24 * 60 * 60 * 1000; // 24 hours
      let hasChanges = false;
      
      for (const [key, item] of globalCacheMap.entries()) {
        if (now - item.timestamp > expiryTime) {
          globalCacheMap.delete(key);
          hasChanges = true;
        }
      }
      
      // If any items were removed, trigger a re-render
      if (hasChanges) {
        setRefreshTrigger(prev => prev + 1);
      }
    }, 60 * 60 * 1000); // Run cleanup hourly
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Efficient cache retrieval function
  const getCachedData = useCallback((key: string, maxAge: number = 30 * 60 * 1000) => {
    const cachedItem = globalCacheMap.get(key);
    
    if (!cachedItem) {
      // Try localStorage as fallback
      try {
        const storedItem = localStorage.getItem(key);
        if (storedItem) {
          const parsedData = JSON.parse(storedItem);
          // Add to memory cache for faster future access
          globalCacheMap.set(key, { data: parsedData, timestamp: Date.now() });
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
  }, []);
  
  // Cache data with current timestamp
  const setCachedData = useCallback((key: string, data: any) => {
    const timestamp = Date.now();
    
    // Update memory cache
    globalCacheMap.set(key, { data, timestamp });
    
    // Also store in localStorage for persistence
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error("Error storing in localStorage:", e);
    }
  }, []);
  
  // Clear cache items
  const clearCache = useCallback((keys?: string[]) => {
    if (keys && Array.isArray(keys)) {
      // Clear specific keys
      for (const key of keys) {
        globalCacheMap.delete(key);
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.error("Error removing from localStorage:", e);
        }
      }
    } else {
      // Clear all cache
      globalCacheMap.clear();
      
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
  }, []);
  
  return { getCachedData, setCachedData, clearCache };
};

// Export any other necessary functions
export * from './location/useLocationCache';
