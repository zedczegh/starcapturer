
import { fetchForecastData } from "@/lib/api";

/**
 * Optimized forecast data fetcher with enhanced caching
 * Fetch forecast data for a given location
 */
export async function fetchForecastForLocation(lat: number, lng: number): Promise<any | null> {
  // Check cache first
  const cacheKey = `forecast-${lat.toFixed(4)}-${lng.toFixed(4)}`;
  
  try {
    // Try to use cached data from sessionStorage if it's fresh (less than 10 minutes old - reduced for fresher data)
    const cachedData = sessionStorage.getItem(cacheKey);
    if (cachedData) {
      const { data, timestamp } = JSON.parse(cachedData);
      const cacheAge = Date.now() - timestamp;
      
      // Use cache if it's less than 10 minutes old
      if (cacheAge < 10 * 60 * 1000) {
        console.log("Using cached forecast data");
        return data;
      } else {
        console.log("Cache is stale, fetching fresh forecast data");
      }
    }
    
    // Fetch fresh data if cache is missing or stale
    console.log("Fetching fresh forecast data");
    const forecastData = await fetchForecastData({
      latitude: lat,
      longitude: lng,
      days: 3
    });
    
    if (forecastData && forecastData.hourly) {
      // Cache the new data
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify({
          data: forecastData,
          timestamp: Date.now()
        }));
        
        // Store reference to last fetched location for faster lookup
        sessionStorage.setItem('last_forecast_location', `${lat.toFixed(4)}-${lng.toFixed(4)}`);
      } catch (e) {
        console.error("Failed to cache forecast data:", e);
      }
      
      return forecastData;
    }
    return null;
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
      // Also clear the last location reference
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
    const cachedData = sessionStorage.getItem(cacheKey);
    
    if (cachedData) {
      const { data, timestamp } = JSON.parse(cachedData);
      const cacheAge = Date.now() - timestamp;
      
      // Consider cache valid if less than 30 minutes old
      if (cacheAge < 30 * 60 * 1000) {
        return data;
      }
    }
    return null;
  } catch (error) {
    console.error("Error retrieving cached forecast:", error);
    return null;
  }
}
