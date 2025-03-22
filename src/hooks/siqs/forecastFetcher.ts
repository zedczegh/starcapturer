
import { fetchForecastData } from "@/lib/api";

/**
 * Fetch forecast data for a given location
 */
export async function fetchForecastForLocation(lat: number, lng: number): Promise<any | null> {
  try {
    const forecastData = await fetchForecastData({
      latitude: lat,
      longitude: lng,
      days: 3
    });
    
    if (forecastData && forecastData.hourly) {
      return forecastData;
    }
    return null;
  } catch (error) {
    console.error("Error fetching forecast data for SIQS calculation:", error);
    return null; // Continue with current weather if forecast fails
  }
}
