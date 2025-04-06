
import { fetchForecastData } from "@/lib/api";

// Cache for forecast data to reduce API calls
const forecastCache = new Map<string, {
  forecast: any;
  timestamp: number;
}>();

// Cache expiration time (30 minutes)
const CACHE_EXPIRATION = 30 * 60 * 1000;

/**
 * Fetch forecast data for a specific location
 * Used by various SIQS calculation hooks
 */
export async function fetchForecastForLocation(latitude: number, longitude: number) {
  try {
    // Validate coordinates
    if (!isFinite(latitude) || !isFinite(longitude)) {
      console.warn("Invalid coordinates provided to fetchForecastForLocation");
      return null;
    }
    
    // Generate cache key
    const cacheKey = `${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
    
    // Check cache for fresh forecast data
    const cachedData = forecastCache.get(cacheKey);
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_EXPIRATION) {
      console.log(`Using cached forecast for ${cacheKey}`);
      return cachedData.forecast;
    }
    
    console.log(`Fetching fresh forecast for ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
    
    // Fetch new forecast data
    const forecast = await fetchForecastData({
      latitude,
      longitude,
      days: 2
    });
    
    // Cache the result
    if (forecast) {
      forecastCache.set(cacheKey, {
        forecast,
        timestamp: Date.now()
      });
    }
    
    return forecast;
  } catch (error) {
    console.error("Error fetching forecast data:", error);
    return null;
  }
}

/**
 * Clear forecast cache for a location
 */
export function clearForecastCache(latitude: number, longitude: number) {
  // Generate cache key
  const cacheKey = `${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
  
  // Remove from cache
  if (forecastCache.has(cacheKey)) {
    forecastCache.delete(cacheKey);
    console.info(`Cleared forecast cache for location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
    return true;
  }
  
  return false;
}

/**
 * Clear all forecast cache data
 */
export function clearAllForecastCache() {
  const size = forecastCache.size;
  forecastCache.clear();
  console.info(`Cleared all forecast cache data (${size} entries)`);
}

/**
 * Get forecast cache size
 */
export function getForecastCacheSize() {
  return forecastCache.size;
}
