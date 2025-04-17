
/**
 * Wrapper for the SIQS calculation service
 */

import { calculateSiqsScore } from './realTimeSiqs/siqsCalculator';
import { SiqsResult, WeatherDataWithClearSky, SiqsCalculationOptions } from './realTimeSiqs/siqsTypes';
import { cacheSiqsResult, getCachedSiqsResult, generateSiqsCacheKey, clearSiqsCache, clearLocationSiqsCache } from './realTimeSiqs/siqsCache';

/**
 * Calculate SIQS for a location
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @param bortleScale Bortle scale (1-9)
 * @param weatherData Current weather data
 * @param options Calculation options
 * @returns SIQS result
 */
export async function calculateSiqs(
  latitude: number,
  longitude: number,
  bortleScale: number,
  weatherData?: any,
  options: SiqsCalculationOptions = {}
): Promise<SiqsResult> {
  try {
    // Check cache first
    const cacheKey = generateSiqsCacheKey(latitude, longitude, bortleScale, weatherData);
    const cachedResult = getCachedSiqsResult(cacheKey);
    
    if (cachedResult) {
      return cachedResult;
    }
    
    // Prepare data for calculation
    const processedWeatherData: WeatherDataWithClearSky = {
      ...(weatherData || {
        temperature: 15,
        humidity: 50,
        cloudCover: 0,
        windSpeed: 5,
        precipitation: 0
      }),
      clearSky: 100 - (weatherData?.cloudCover || 0),
      latitude, // Include for additional context
      longitude // Include for additional context
    };
    
    // Calculate base SIQS score
    const result = calculateSiqsScore(bortleScale, processedWeatherData, options);
    
    // Cache result
    cacheSiqsResult(cacheKey, result);
    
    return result;
  } catch (error) {
    console.error('Error calculating SIQS:', error);
    return {
      siqs: 0,
      score: 0,
      isViable: false,
      factors: []
    };
  }
}

// Re-export cache functions
export { clearSiqsCache, clearLocationSiqsCache };

// Export the main function as with a backward-compatible alias
export const calculateRealTimeSiqs = calculateSiqs;
export { generateSiqsCacheKey };
