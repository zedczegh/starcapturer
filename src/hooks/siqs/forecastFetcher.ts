
import { fetchForecastData } from "@/lib/api";

/**
 * Optimized forecast data fetcher with caching
 * Fetch forecast data for a given location
 */
export async function fetchForecastForLocation(lat: number, lng: number): Promise<any | null> {
  // Check cache first
  const cacheKey = `forecast-${lat.toFixed(4)}-${lng.toFixed(4)}`;
  
  try {
    // Try to use cached data from sessionStorage if it's fresh (less than 30 minutes old)
    const cachedData = sessionStorage.getItem(cacheKey);
    if (cachedData) {
      const { data, timestamp } = JSON.parse(cachedData);
      const cacheAge = Date.now() - timestamp;
      
      // Use cache if it's less than 30 minutes old
      if (cacheAge < 30 * 60 * 1000) {
        console.log("Using cached forecast data");
        return data;
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
