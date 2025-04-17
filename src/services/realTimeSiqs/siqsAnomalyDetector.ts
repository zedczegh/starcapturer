
/**
 * SIQS anomaly detection utilities
 */
import { SiqsResult, WeatherData } from './siqsTypes';

/**
 * Detect anomalies in SIQS calculation
 */
export function detectSiqsAnomaly(
  result: SiqsResult,
  latitude: number,
  longitude: number,
  bortleScale: number,
  weatherData?: WeatherData
): boolean {
  // Check for obviously incorrect results
  if (result.siqs > 10 || result.siqs < 0) {
    return true;
  }
  
  // Check for inconsistent results with given weather
  if (weatherData && weatherData.cloudCover > 80 && result.siqs > 8) {
    return true;
  }
  
  // Check for inconsistent results with light pollution
  if (bortleScale > 7 && result.siqs > 7) {
    return true;
  }
  
  // More advanced checks could be added here
  return false;
}

/**
 * Fix anomalous SIQS result
 */
export function fixAnomalousSiqs(
  result: SiqsResult,
  bortleScale: number,
  weatherData?: WeatherData
): SiqsResult {
  // Clone the result to avoid modifying the original
  const fixedResult = { ...result };
  
  // Ensure SIQS is within valid range
  fixedResult.siqs = Math.max(0, Math.min(10, fixedResult.siqs));
  fixedResult.score = fixedResult.siqs;
  
  // Fix inconsistent results based on cloud cover
  if (weatherData && weatherData.cloudCover) {
    const maxSiqsWithClouds = 10 - (weatherData.cloudCover / 10);
    fixedResult.siqs = Math.min(fixedResult.siqs, maxSiqsWithClouds);
    fixedResult.score = fixedResult.siqs;
  }
  
  // Fix inconsistent results with light pollution
  if (bortleScale > 0) {
    // Each Bortle level reduces maximum SIQS
    const maxSiqsWithBortle = 10 - ((bortleScale - 1) * 0.8);
    fixedResult.siqs = Math.min(fixedResult.siqs, maxSiqsWithBortle);
    fixedResult.score = fixedResult.siqs;
  }
  
  return fixedResult;
}
