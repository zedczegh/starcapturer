
import { fetchForecastData } from "@/lib/api";

/**
 * Optimized forecast data fetcher with enhanced caching
 * Fetch forecast data for a given location
 */
export async function fetchForecastForLocation(lat: number, lng: number): Promise<any | null> {
  // Check cache first
  const cacheKey = `forecast-${lat.toFixed(4)}-${lng.toFixed(4)}`;
  
  try {
    // Try to use cached data from sessionStorage if it's fresh
    // During nighttime, cache is valid for 30 minutes; during day, only 10 minutes
    const cachedData = sessionStorage.getItem(cacheKey);
    if (cachedData) {
      const { data, timestamp } = JSON.parse(cachedData);
      const cacheAge = Date.now() - timestamp;
      
      // Determine if it's nighttime for caching purposes
      const hour = new Date().getHours();
      const isNighttime = hour >= 18 || hour < 8; // 6 PM to 8 AM
      const cacheDuration = isNighttime ? 30 * 60 * 1000 : 10 * 60 * 1000; // 30 min at night, 10 min during day
      
      // Use cache if it's fresh
      if (cacheAge < cacheDuration) {
        console.log(`Using cached forecast data (${Math.round(cacheAge / 60000)} minutes old)`);
        return data;
      } else {
        console.log(`Cache is stale (${Math.round(cacheAge / 60000)} minutes old), fetching fresh forecast data`);
      }
    }
    
    // Fetch fresh data if cache is missing or stale
    console.log("Fetching fresh forecast data");
    const forecastData = await fetchForecastData({
      latitude: lat,
      longitude: lng,
      days: 3 // Ensure we have enough data for full nighttime coverage
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
      
      // Consider cache valid if less than 30 minutes old during night, 15 minutes during day
      const hour = new Date().getHours();
      const isNighttime = hour >= 18 || hour < 8; // 6 PM to 8 AM
      const cacheDuration = isNighttime ? 30 * 60 * 1000 : 15 * 60 * 1000;
      
      if (cacheAge < cacheDuration) {
        return data;
      }
    }
    return null;
  } catch (error) {
    console.error("Error retrieving cached forecast:", error);
    return null;
  }
}
