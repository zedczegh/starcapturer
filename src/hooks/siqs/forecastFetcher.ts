import { fetchForecastData } from "@/lib/api/forecast";

// Cache for forecasts to avoid redundant fetches
const forecastCache: Record<string, { data: any; timestamp: number }> = {};

/**
 * Fetch forecast data for a location
 * Uses caching to improve performance and reduce API calls
 */
export const fetchForecastForLocation = async (latitude: number, longitude: number) => {
  // Generate cache key
  const cacheKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
  
  // Check cache first
  const cachedForecast = forecastCache[cacheKey];
  const now = Date.now();
  
  // If we have a cached forecast less than 30 minutes old, use it
  if (cachedForecast && now - cachedForecast.timestamp < 30 * 60 * 1000) {
    console.log("Using cached forecast data");
    return cachedForecast.data;
  }
  
  // Otherwise fetch new data
  try {
    console.log("Fetching fresh forecast data");
    const forecastData = await fetchForecastData({
      latitude,
      longitude,
      days: 3
    });
    
    // Cache the result
    if (forecastData) {
      forecastCache[cacheKey] = {
        data: forecastData,
        timestamp: now
      };
    }
    
    return forecastData;
  } catch (error) {
    console.error("Error fetching forecast data:", error);
    return null;
  }
};

/**
 * Clear the forecast cache for a specific location or all locations
 */
export const clearForecastCache = (latitude?: number, longitude?: number) => {
  if (latitude !== undefined && longitude !== undefined) {
    // Clear cache for specific location
    const cacheKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
    delete forecastCache[cacheKey];
    console.log(`Cleared forecast cache for ${cacheKey}`);
  } else {
    // Clear all cache
    Object.keys(forecastCache).forEach(key => {
      delete forecastCache[key];
    });
    console.log("Cleared all forecast cache");
  }
};
