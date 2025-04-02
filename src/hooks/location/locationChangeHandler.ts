
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
    console.log("Handling location change for", name, latitude, longitude);
    
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
      // First try to get light pollution data which includes Bortle scale
      const pollutionData = await fetchLightPollutionData(latitude, longitude);
      
      // Use the Bortle scale from pollution data or fetch specifically
      bortleScale = pollutionData?.bortleScale || 
                    (await fetchBortleData(latitude, longitude));
      
      console.log("Got Bortle scale for location:", bortleScale);
    } catch (error) {
      console.error("Error fetching light pollution data:", error);
      bortleScale = 5; // Default fallback
    }
    
    // Calculate initial SIQS score based on current weather
    const siqsResult = await calculateSIQSWithWeatherData(
      weatherData,
      bortleScale,
      3, // Default seeing conditions
      moonPhase,
      null // No forecast data yet
    );
    
    console.log("Calculated SIQS result:", siqsResult);
    
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
