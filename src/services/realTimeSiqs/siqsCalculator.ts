
import { fetchForecastData, fetchWeatherData } from "@/lib/api";
import { calculateSIQSWithWeatherData } from "@/hooks/siqs/siqsCalculationUtils";
import { fetchLightPollutionData } from "@/lib/api/pollution";
import { fetchClearSkyRate } from "@/lib/api/clearSkyRate";
import {
  hasCachedSiqs,
  getCachedSiqs,
  setSiqsCache
} from "./siqsCache";

/**
 * Calculate real-time SIQS for a given location
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @param bortleScale Optional Bortle scale (default: 4)
 * @returns SIQS result object
 */
export async function calculateRealTimeSiqs(
  latitude: number,
  longitude: number,
  bortleScale: number = 4
) {
  try {
    // Check cache first
    if (hasCachedSiqs(latitude, longitude)) {
      return getCachedSiqs(latitude, longitude);
    }
    
    // Fetch weather data
    const weatherData = await fetchWeatherData(latitude, longitude);
    
    // Fetch forecast data
    const forecastData = await fetchForecastData(latitude, longitude);
    
    // Fetch light pollution data
    const lightPollutionData = await fetchLightPollutionData(latitude, longitude);
    
    // Fetch clear sky rate
    const clearSkyRate = await fetchClearSkyRate(latitude, longitude);
    
    // Calculate SIQS
    const siqsResult = calculateSIQSWithWeatherData(
      weatherData,
      forecastData,
      lightPollutionData,
      clearSkyRate,
      bortleScale
    );
    
    // Cache the result
    setSiqsCache(latitude, longitude, siqsResult);
    
    return {
      siqs: siqsResult.score,
      isViable: siqsResult.isViable
    };
  } catch (error) {
    console.error("Error calculating real-time SIQS:", error);
    return {
      siqs: 0,
      isViable: false
    };
  }
}
