
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
      console.log("Using in-memory cached forecast data");
      return memCached.data;
    }
    
    // Then check sessionStorage
    const cachedData = sessionStorage.getItem(cacheKey);
    if (cachedData) {
      const { data, timestamp } = JSON.parse(cachedData);
      const cacheAge = Date.now() - timestamp;
      
      if (cacheAge < CACHE_DURATION) {
        console.log("Using session-stored cached forecast data");
        
        // Update memory cache
        memoryCache.set(cacheKey, { data, timestamp });
        
        return data;
      }
    }
    
    // If there's already a pending fetch, reuse that promise
    if (pendingFetches.has(cacheKey)) {
      console.log("Reusing in-progress forecast fetch");
      return pendingFetches.get(cacheKey);
    }
    
    // Fetch fresh data if cache is missing or stale
    console.log("Fetching fresh forecast data");
    
    const fetchPromise = fetchForecastData({
      latitude: lat,
      longitude: lng,
      days: 3
    }).then(forecastData => {
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
    }).finally(() => {
      // Remove from pending fetches when done
      pendingFetches.delete(cacheKey);
    });
    
    // Store the promise for deduplication
    pendingFetches.set(cacheKey, fetchPromise);
    
    return fetchPromise;
  } catch (error) {
    console.error("Error fetching forecast data for SIQS calculation:", error);
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
      console.log(`Cleared forecast cache for location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    } else {
      // Clear all forecast cache entries
      let cacheCleared = 0;
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('forecast-')) {
          sessionStorage.removeItem(key);
          cacheCleared++;
        }
      });
      // Also clear memory cache and the last location reference
      memoryCache.clear();
      sessionStorage.removeItem('last_forecast_location');
      console.log(`Cleared ${cacheCleared} forecast cache entries`);
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
