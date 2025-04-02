
import { fetchForecastData } from "@/lib/api";

// Cache to reduce API calls
const forecastCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_LIFETIME = 30 * 60 * 1000; // 30 minutes

/**
 * Optimized function to fetch forecast data for a location
 * Uses caching to improve performance and reduce API calls
 * @param lat Latitude
 * @param lng Longitude
 * @returns Forecast data object
 */
export const fetchForecastForLocation = async (
  lat: number,
  lng: number
): Promise<any> => {
  // Generate cache key
  const cacheKey = `forecast-${lat.toFixed(4)}-${lng.toFixed(4)}`;
  
  // Check cache first
  const cached = forecastCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_LIFETIME) {
    console.log("Using cached forecast data");
    return cached.data;
  }
  
  try {
    // Fetch new forecast data
    console.log("Fetching fresh forecast data");
    const forecastData = await fetchForecastData({
      latitude: lat,
      longitude: lng,
      days: 2 // Get forecast for today and tomorrow
    });
    
    // Save to cache
    if (forecastData) {
      forecastCache.set(cacheKey, {
        data: forecastData,
        timestamp: Date.now()
      });
    }
    
    return forecastData;
  } catch (error) {
    console.error("Error fetching forecast data:", error);
    return null;
  }
};

/**
 * Clear forecast cache for testing or debugging
 */
export const clearForecastCache = (): void => {
  forecastCache.clear();
  console.log("Forecast cache cleared");
};

/**
 * Get the current forecast cache size
 * @returns Number of cached forecasts
 */
export const getForecastCacheSize = (): number => {
  return forecastCache.size;
};
