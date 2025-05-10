
import { fetchForecastData } from "@/lib/api";

/**
 * Optimized forecast data fetcher with enhanced caching
 */

// In-memory cache to avoid repeated localStorage access
const memoryCache = new Map<string, {data: any; timestamp: number}>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
const pendingFetches = new Map<string, Promise<any>>();

/**
 * Fetch forecast data for a given location
 */
export async function fetchForecastForLocation(lat: number, lng: number): Promise<any | null> {
  if (!isFinite(lat) || !isFinite(lng)) {
    console.error("Invalid coordinates in fetchForecastForLocation");
    return null;
  }
  
  // Check cache first
  const cacheKey = `forecast-${lat.toFixed(4)}-${lng.toFixed(4)}`;
  
  try {
    // Check in-memory cache first (fastest)
    const memCached = memoryCache.get(cacheKey);
    if (memCached && (Date.now() - memCached.timestamp) < CACHE_DURATION) {
      return memCached.data;
    }
    
    // Then check sessionStorage
    const cachedData = sessionStorage.getItem(cacheKey);
    if (cachedData) {
      const { data, timestamp } = JSON.parse(cachedData);
      const cacheAge = Date.now() - timestamp;
      
      if (cacheAge < CACHE_DURATION) {
        // Update memory cache
        memoryCache.set(cacheKey, { data, timestamp });
        return data;
      }
    }
    
    // If there's already a pending fetch, reuse that promise
    if (pendingFetches.has(cacheKey)) {
      return pendingFetches.get(cacheKey);
    }
    
    // Fetch fresh data if cache is missing or stale
    // Use AbortController to allow aborting slow requests
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 8000); // Timeout after 8 seconds
    
    const fetchPromise = fetchForecastData({
      latitude: lat,
      longitude: lng,
      days: 3
    }, { signal: abortController.signal as AbortSignal }).then(forecastData => {
      clearTimeout(timeoutId);
      
      if (forecastData && forecastData.hourly) {
        // Cache the new data
        try {
          // Update both caches
          const timestamp = Date.now();
          memoryCache.set(cacheKey, { data: forecastData, timestamp });
          
          sessionStorage.setItem(cacheKey, JSON.stringify({
            data: forecastData,
            timestamp
          }));
          
          // Store reference to last fetched location for faster lookup
          sessionStorage.setItem('last_forecast_location', `${lat.toFixed(4)}-${lng.toFixed(4)}`);
        } catch (e) {
          console.error("Failed to cache forecast data:", e);
        }
      }
      return forecastData;
    }).catch(error => {
      clearTimeout(timeoutId);
      
      // Don't throw for abort errors
      if (error.name === 'AbortError') {
        console.warn("Forecast request aborted due to timeout");
        return null;
      }
      throw error;
    }).finally(() => {
      // Remove from pending fetches when done
      pendingFetches.delete(cacheKey);
    });
    
    // Store the promise for deduplication
    pendingFetches.set(cacheKey, fetchPromise);
    
    return fetchPromise;
  } catch (error) {
    console.error("Error fetching forecast data for SIQS calculation:", error);
    pendingFetches.delete(cacheKey);
    return null; // Continue with current weather if forecast fails
  }
}

/**
 * Clear forecast cache for specific location or all locations
 */
export function clearForecastCache(lat?: number, lng?: number): void {
  try {
    if (lat !== undefined && lng !== undefined) {
      // Clear specific location
      const cacheKey = `forecast-${lat.toFixed(4)}-${lng.toFixed(4)}`;
      sessionStorage.removeItem(cacheKey);
      memoryCache.delete(cacheKey);
    } else {
      // Clear all forecast cache entries
      let cacheCleared = 0;
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('forecast-')) {
          sessionStorage.removeItem(key);
          cacheCleared++;
        }
      }
      // Also clear memory cache and the last location reference
      memoryCache.clear();
      sessionStorage.removeItem('last_forecast_location');
    }
  } catch (error) {
    console.error("Error clearing forecast cache:", error);
  }
}

/**
 * Get cached forecast data without network request
 */
export function getCachedForecast(lat: number, lng: number): any | null {
  try {
    const cacheKey = `forecast-${lat.toFixed(4)}-${lng.toFixed(4)}`;
    
    // Check memory cache first
    const memCached = memoryCache.get(cacheKey);
    if (memCached && (Date.now() - memCached.timestamp < CACHE_DURATION)) {
      return memCached.data;
    }
    
    // Then check session storage
    const cachedData = sessionStorage.getItem(cacheKey);
    if (cachedData) {
      const { data, timestamp } = JSON.parse(cachedData);
      const cacheAge = Date.now() - timestamp;
      
      // Consider cache valid if less than duration
      if (cacheAge < CACHE_DURATION) {
        // Update memory cache for faster access next time
        memoryCache.set(cacheKey, { data, timestamp });
        return data;
      }
    }
    return null;
  } catch (error) {
    console.error("Error retrieving cached forecast:", error);
    return null;
  }
}

/**
 * Prefetch forecast data for likely locations
 */
export function prefetchForecastData(locations: Array<{lat: number, lng: number}>): void {
  if (!locations.length) return;
  
  // Use requestIdleCallback if available
  const scheduleFunc = window.requestIdleCallback || setTimeout;
  
  // Limit to first 3 locations to avoid excessive prefetching
  const limitedLocations = locations.slice(0, 3);
  
  scheduleFunc(() => {
    limitedLocations.forEach(({lat, lng}) => {
      fetchForecastForLocation(lat, lng).catch(() => {});
    });
  });
}
