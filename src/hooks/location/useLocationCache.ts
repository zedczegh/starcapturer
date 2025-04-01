
import { useState, useCallback } from 'react';

/**
 * Custom hook for caching and retrieving location data in localStorage
 */
const useLocationCache = () => {
  const [cacheChanged, setCacheChanged] = useState(false);

  /**
   * Save data to the location cache
   */
  const setCachedData = useCallback((key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
      setCacheChanged(prev => !prev);
    } catch (error) {
      console.error("Error saving to location cache:", error);
    }
  }, []);

  /**
   * Get data from the location cache
   * @param {string} key - The cache key
   * @param {number} maxAge - Maximum age in milliseconds (optional)
   * @returns {any} The cached data or null if not found or expired
   */
  const getCachedData = useCallback((key: string, maxAge?: number): any => {
    try {
      const cached = localStorage.getItem(key);
      
      if (!cached) return null;
      
      const { data, timestamp } = JSON.parse(cached);
      
      if (maxAge && Date.now() - timestamp > maxAge) {
        // Cache expired
        localStorage.removeItem(key);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error("Error retrieving from location cache:", error);
      return null;
    }
  }, []);

  /**
   * Clear a specific item from the cache
   */
  const clearCacheItem = useCallback((key: string) => {
    try {
      localStorage.removeItem(key);
      setCacheChanged(prev => !prev);
    } catch (error) {
      console.error("Error clearing cache item:", error);
    }
  }, []);

  /**
   * Clear all location cache items
   */
  const clearAllCache = useCallback(() => {
    try {
      const cacheKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('location-') || key.startsWith('forecast-') || key.startsWith('weather-'))) {
          cacheKeys.push(key);
        }
      }
      
      cacheKeys.forEach(key => localStorage.removeItem(key));
      setCacheChanged(prev => !prev);
    } catch (error) {
      console.error("Error clearing location cache:", error);
    }
  }, []);

  return {
    setCachedData,
    getCachedData,
    clearCacheItem,
    clearAllCache,
    cacheChanged
  };
};

export default useLocationCache;
