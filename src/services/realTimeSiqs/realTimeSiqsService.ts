
/**
 * Real-time SIQS calculation service
 */

import { generateSiqsCacheKey, cacheSiqsResult, getCachedSiqsResult, cleanupExpiredCache, clearLocationSiqsCache } from './siqsCache';
import { calculateSiqsScore } from './siqsCalculator';
import { detectSiqsAnomaly, fixAnomalousSiqs } from './siqsAnomalyDetector';
import { SiqsResult, WeatherData, WeatherDataWithClearSky, SiqsCalculationOptions } from './siqsTypes';
import { applyIntelligentAdjustments } from './siqsAdjustments';

/**
 * Calculate SIQS for a location
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @param bortleScale Bortle scale (1-9)
 * @param weatherData Current weather data
 * @param options Calculation options
 * @returns SIQS result
 */
export async function calculateRealTimeSiqs(
  latitude: number,
  longitude: number,
  bortleScale: number,
  weatherData?: WeatherData,
  options: SiqsCalculationOptions = {}
): Promise<SiqsResult> {
  try {
    // Check cache first
    const cacheKey = generateSiqsCacheKey(latitude, longitude, bortleScale, weatherData);
    const cachedResult = getCachedSiqsResult(cacheKey);
    
    if (cachedResult && !options.anomalyDetection) {
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
      latitude: latitude, // Include for additional context
      longitude: longitude // Include for additional context
    };
    
    // Calculate base SIQS score
    const result = calculateSiqsScore(bortleScale, processedWeatherData, options);
    
    // Apply intelligent adjustments based on location and climate
    const adjustedSiqs = applyIntelligentAdjustments(
      result.siqs,
      latitude,
      longitude,
      weatherData
    );
    
    result.siqs = adjustedSiqs;
    result.score = adjustedSiqs; // Ensure both properties are set
    
    // Detect and fix anomalies if enabled
    if (options.anomalyDetection && detectSiqsAnomaly(result, latitude, longitude, bortleScale, weatherData)) {
      const fixedResult = fixAnomalousSiqs(result, bortleScale, weatherData);
      cacheSiqsResult(cacheKey, fixedResult);
      return fixedResult;
    }
    
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
