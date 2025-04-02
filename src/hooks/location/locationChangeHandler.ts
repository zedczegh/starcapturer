
import { fetchWeatherData } from "@/lib/api";
import { calculateMoonPhase } from "@/utils/siqsValidation";
import { calculateSIQSWithWeatherData } from "@/hooks/siqs/siqsCalculationUtils";
import { fetchLightPollutionData } from "@/lib/api/pollution";
import { fetchBortleData } from "@/lib/api/bortle";

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
    
    // Get Bortle scale data for the location
    let bortleScale: number;
    try {
      const pollutionData = await fetchLightPollutionData(latitude, longitude);
      bortleScale = pollutionData?.bortleScale || 
                    (await fetchBortleData(latitude, longitude));
    } catch (error) {
      console.error("Error fetching light pollution data:", error);
      bortleScale = 5; // Default fallback
    }
    
    // Calculate initial SIQS score based on current weather
    const siqsResult = await calculateSIQSWithWeatherData(
      weatherData,
      bortleScale,
      3, // Default seeing conditions
      moonPhase
    );
    
    // Return the updated location data with SIQS included
    return {
      name,
      latitude,
      longitude,
      weatherData,
      moonPhase,
      bortleScale,
      siqsResult,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error updating location:", error);
    throw new Error("Failed to update location data");
  }
};
