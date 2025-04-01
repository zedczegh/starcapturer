
import { fetchForecastData } from './forecast';

/**
 * Fetch today's forecast data
 */
export async function fetchForecastDataForToday({
  latitude,
  longitude
}: {
  latitude: number;
  longitude: number;
}) {
  try {
    // Use the existing forecast endpoint but only request 1 day
    const forecastData = await fetchForecastData({
      latitude,
      longitude,
      days: 1
    });
    
    if (!forecastData) {
      console.error("Failed to fetch today's forecast data");
      return null;
    }
    
    return forecastData;
  } catch (error) {
    console.error("Error fetching today's forecast data:", error);
    return null;
  }
}
