
import { fetchWeatherData } from "@/lib/api";
import { calculateMoonPhase } from "@/utils/siqsValidation";

/**
 * Handles location changes and updates with proper data fetching
 */
export const handleLocationChange = async (
  latitude: number,
  longitude: number,
  name: string,
  language: string = 'en'
): Promise<any> => {
  try {
    // Fetch weather data for the new location
    const weatherData = await fetchWeatherData({
      latitude,
      longitude
    });
    
    // Calculate moon phase
    const moonPhase = calculateMoonPhase();
    
    // Return the updated location data
    return {
      name,
      latitude,
      longitude,
      weatherData,
      moonPhase,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error updating location:", error);
    throw new Error("Failed to update location data");
  }
};
