
/**
 * Utility to detect anomalous SIQS scores
 * This helps identify potentially erroneous calculations
 */

import { SiqsResult, WeatherData } from './siqsTypes';
import { generateSiqsCacheKey, getCachedSiqsResult } from './siqsCache';

/**
 * Check if a SIQS calculation is anomalous
 */
export function detectSiqsAnomaly(
  result: SiqsResult,
  latitude: number,
  longitude: number,
  bortleScale: number,
  weatherData?: WeatherData
): boolean {
  // Check if SIQS value is within realistic range
  if (result.siqs < 0 || result.siqs > 10) {
    return true;
  }
  
  // Check for unusually high SIQS with high Bortle scale
  if (result.siqs > 8 && bortleScale > 6) {
    return true;
  }
  
  // Check for unusually high SIQS with high cloud cover
  if (weatherData?.cloudCover && weatherData.cloudCover > 80 && result.siqs > 7) {
    return true;
  }
  
  // Calculate expected SIQS range based on Bortle scale
  const expectedBase = 10 - bortleScale;
  const minExpected = Math.max(1, expectedBase - 2);
  const maxExpected = Math.min(10, expectedBase + 2);
  
  // If result is far outside expected range, it's anomalous
  if (result.siqs < minExpected * 0.5 || result.siqs > maxExpected * 1.5) {
    return true;
  }
  
  return false;
}

/**
 * Check if cached SIQS differs significantly from new calculation
 */
export function detectCacheDivergence(
  newResult: SiqsResult,
  latitude: number,
  longitude: number,
  bortleScale: number,
  weatherData?: WeatherData
): boolean {
  const cacheKey = generateSiqsCacheKey(latitude, longitude, bortleScale, weatherData);
  const cached = getCachedSiqsResult(cacheKey);
  
  if (!cached) {
    return false;
  }
  
  // Check if new result differs significantly from cached
  const diff = Math.abs(newResult.siqs - cached.siqs);
  
  // More than 30% difference is suspicious
  return diff > (cached.siqs * 0.3);
}

/**
 * Fix anomalous SIQS scores
 */
export function fixAnomalousSiqs(
  result: SiqsResult,
  bortleScale: number,
  weatherData?: WeatherData
): SiqsResult {
  // Base expected SIQS on Bortle scale
  let expectedBase = 10 - bortleScale;
  
  // Adjust expected base for weather conditions
  if (weatherData) {
    // Reduce for cloud cover
    if (weatherData.cloudCover) {
      expectedBase *= (1 - (weatherData.cloudCover / 100) * 0.8);
    }
    
    // Adjust for other factors
    if (weatherData.windSpeed && weatherData.windSpeed > 15) {
      expectedBase *= 0.9;
    }
    
    if (weatherData.humidity && weatherData.humidity > 80) {
      expectedBase *= 0.95;
    }
  }
  
  // Ensure expected base is within valid range
  expectedBase = Math.max(1, Math.min(9, expectedBase));
  
  // Create adjusted result
  const adjustedResult: SiqsResult = {
    ...result,
    siqs: expectedBase,
    score: expectedBase
  };
  
  return adjustedResult;
}
