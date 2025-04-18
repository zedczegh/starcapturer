
import { fetchForecastData, fetchWeatherData } from "@/lib/api";
import { calculateSIQSWithWeatherData } from "@/hooks/siqs/siqsCalculationUtils";
import { fetchLightPollutionData } from "@/lib/api/pollution";
import { fetchClearSkyRate } from "@/lib/api/clearSkyRate";
import {
  hasCachedSiqs,
  getCachedSiqs,
  setSiqsCache
} from "./siqsCache";
import { SiqsResult } from "./siqsTypes";

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
): Promise<SiqsResult> {
  try {
    // Check cache first
    if (hasCachedSiqs(latitude, longitude)) {
      return getCachedSiqs(latitude, longitude) as SiqsResult;
    }
    
    // Fetch weather data
    const weatherData = await fetchWeatherData({
      latitude, 
      longitude
    });
    
    // Fetch forecast data - passing the coordinates object
    const forecastData = await fetchForecastData({
      latitude, 
      longitude
    });
    
    // Fetch light pollution data - passing the coordinates object
    const lightPollutionData = await fetchLightPollutionData({
      latitude, 
      longitude
    });
    
    // Fetch clear sky rate
    const clearSkyRate = await fetchClearSkyRate(latitude, longitude);
    
    // Calculate SIQS - use bortleScale directly as a number, not as an object
    const siqsResult = await calculateSIQSWithWeatherData(
      weatherData,
      forecastData,
      lightPollutionData,
      clearSkyRate,
      bortleScale // Pass bortleScale directly as a number
    );
    
    // Convert legacy format to new SiqsResult format if needed
    const standardizedResult: SiqsResult = {
      score: siqsResult.score || (typeof siqsResult.siqs === 'number' ? siqsResult.siqs : 0),
      isViable: siqsResult.isViable,
      factors: siqsResult.factors
    };
    
    // Cache the result
    setSiqsCache(latitude, longitude, standardizedResult);
    
    return standardizedResult;
  } catch (error) {
    console.error("Error calculating real-time SIQS:", error);
    return {
      score: 0,
      isViable: false
    };
  }
}
