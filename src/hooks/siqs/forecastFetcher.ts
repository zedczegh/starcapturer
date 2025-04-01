
/**
 * Utility to fetch forecast data for SIQS calculation
 */

import { fetchForecastData } from "@/lib/api";

// Cache to optimize redundant forecast requests
const forecastCache = new Map<string, {
  data: any;
  timestamp: number;
}>();

// Cache lifetime: 30 minutes
const CACHE_LIFETIME = 30 * 60 * 1000;

/**
 * Fetch forecast data for a location with caching
 * @param latitude - Latitude of the location
 * @param longitude - Longitude of the location
 * @param days - Number of days to forecast (default: 2)
 * @returns Forecast data object or null if fetch fails
 */
export async function fetchForecastForLocation(
  latitude: number,
  longitude: number,
  days: number = 2
): Promise<any | null> {
  // Generate cache key
  const cacheKey = `forecast-${latitude.toFixed(4)}-${longitude.toFixed(4)}-${days}`;
  
  // Check cache
  const cached = forecastCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_LIFETIME) {
    console.log(`Using cached forecast for ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
    return cached.data;
  }
  
  try {
    // Fetch fresh data
    console.log(`Fetching forecast for ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
    
    const forecastData = await fetchForecastData({
      latitude,
      longitude,
      days
    });
    
    // Cache the result
    forecastCache.set(cacheKey, {
      data: forecastData,
      timestamp: Date.now()
    });
    
    return forecastData;
  } catch (error) {
    console.error("Error fetching forecast data:", error);
    return null;
  }
}

/**
 * Clear the forecast cache
 * Optional parameters to clear cache for a specific location
 */
export function clearForecastCache(
  latitude?: number,
  longitude?: number
): void {
  if (latitude !== undefined && longitude !== undefined) {
    // Clear cache for a specific location
    const keyPrefix = `forecast-${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
    
    // Delete all entries for this location
    for (const key of forecastCache.keys()) {
      if (key.startsWith(keyPrefix)) {
        forecastCache.delete(key);
      }
    }
    console.log(`Forecast cache cleared for ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
  } else {
    // Clear entire cache
    forecastCache.clear();
    console.log("Forecast cache cleared");
  }
}
