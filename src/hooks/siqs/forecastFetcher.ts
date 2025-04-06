
import { fetchForecastData } from "@/lib/api";

/**
 * Fetch forecast data for a specific location
 * Used by various SIQS calculation hooks
 */
export async function fetchForecastForLocation(latitude: number, longitude: number) {
  try {
    const forecast = await fetchForecastData({
      latitude,
      longitude,
      days: 2
    });
    
    return forecast;
  } catch (error) {
    console.error("Error fetching forecast data:", error);
    return null;
  }
}

/**
 * Clear forecast cache for a location
 * This function can be implemented when needed for cache management
 */
export function clearForecastCache(latitude: number, longitude: number) {
  console.info(`Cleared forecast cache for location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
  // Implementation for cache clearing would go here
}
