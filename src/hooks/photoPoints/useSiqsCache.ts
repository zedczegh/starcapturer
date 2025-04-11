
import { useCallback } from 'react';

// Cache duration in milliseconds (30 minutes)
const CACHE_DURATION = 30 * 60 * 1000;

// Local in-memory cache to avoid repeated calculations
const siqsCache = new Map<string, {
  siqs: number;
  timestamp: number;
}>();

/**
 * Hook for managing SIQS calculation caching
 */
export const useSiqsCache = () => {
  /**
   * Get SIQS from cache if available
   */
  const getSiqsFromCache = useCallback((latitude: number, longitude: number): number | null => {
    const cacheKey = `${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
    const cached = siqsCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      console.log(`Using cached SIQS for ${cacheKey}: ${cached.siqs}`);
      return cached.siqs;
    }
    
    return null;
  }, []);
  
  /**
   * Save SIQS to cache
   */
  const cacheSiqs = useCallback((latitude: number, longitude: number, siqs: number) => {
    const cacheKey = `${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
    
    siqsCache.set(cacheKey, {
      siqs,
      timestamp: Date.now()
    });
    
    // Also store in localStorage for persistence across sessions
    try {
      localStorage.setItem(`siqs_cache_${cacheKey}`, JSON.stringify({
        siqs,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error("Error caching SIQS in localStorage:", error);
    }
    
    console.log(`Cached SIQS for ${cacheKey}: ${siqs}`);
  }, []);
  
  /**
   * Clean old cache entries
   */
  const cleanupCache = useCallback(() => {
    const now = Date.now();
    
    // Clean up memory cache
    for (const [key, value] of siqsCache.entries()) {
      if (now - value.timestamp > CACHE_DURATION) {
        siqsCache.delete(key);
      }
    }
    
    // Clean up localStorage cache
    try {
      const keys = Object.keys(localStorage);
      const siqsKeys = keys.filter(key => key.startsWith('siqs_cache_'));
      
      siqsKeys.forEach(key => {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            const parsed = JSON.parse(data);
            if (now - parsed.timestamp > CACHE_DURATION) {
              localStorage.removeItem(key);
            }
          } catch (e) {
            localStorage.removeItem(key); // Remove invalid cache entries
          }
        }
      });
    } catch (e) {
      console.error("Error cleaning up SIQS cache:", e);
    }
  }, []);
  
  return {
    getSiqsFromCache,
    cacheSiqs,
    cleanupCache
  };
};
