
/**
 * API functions for fetching daily forecast data
 */
import { fetchForecastData } from './forecast';

/**
 * Fetches forecast data for the current day
 */
export async function fetchForecastDataForToday({ 
  latitude, 
  longitude 
}: { 
  latitude: number; 
  longitude: number 
}): Promise<any> {
  try {
    console.log(`Fetching forecast data for today at ${latitude}, ${longitude}`);
    
    // Use the existing forecast API but only return data for today
    const forecastData = await fetchForecastData(latitude, longitude);
    
    if (!forecastData) {
      throw new Error("Failed to fetch forecast data");
    }
    
    // Filter to only include hours for the current day
    const now = new Date();
    const todayString = now.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Filter hourly forecast to only include hours from today
    if (forecastData.hourly) {
      forecastData.hourly = forecastData.hourly.filter((hour: any) => {
        const hourDate = new Date(hour.time);
        return hourDate.toISOString().split('T')[0] === todayString;
      });
    }
    
    return forecastData;
  } catch (error) {
    console.error("Error fetching today's forecast data:", error);
    return null;
  }
}
