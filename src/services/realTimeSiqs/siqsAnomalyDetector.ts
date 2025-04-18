
import { SiqsResult, SiqsLocationInfo, WeatherDataWithClearSky } from './siqsTypes';

interface ReliabilityResult {
  reliable: boolean;
  confidenceScore: number;
  issues: string[];
}

/**
 * Detect and fix anomalies in SIQS calculation
 */
export function detectAndFixAnomalies(
  result: SiqsResult,
  weatherData: WeatherDataWithClearSky,
  locationInfo: SiqsLocationInfo
): SiqsResult {
  // Simple implementation - just returns the original result for now
  // This would be enhanced with more sophisticated anomaly detection in the future
  return result;
}

/**
 * Assess the reliability of data used in SIQS calculation
 */
export function assessDataReliability(
  weatherData: WeatherDataWithClearSky,
  forecastData: any
): ReliabilityResult {
  const issues: string[] = [];
  
  // Basic reliability checks
  if (!weatherData.cloudCover && weatherData.cloudCover !== 0) {
    issues.push("Missing cloud cover data");
  }
  
  // Calculate confidence score (0-10)
  let confidenceScore = 10;
  
  // Reduce confidence for each issue
  confidenceScore -= issues.length * 2;
  
  // Ensure score stays in range
  confidenceScore = Math.max(0, Math.min(10, confidenceScore));
  
  return {
    reliable: confidenceScore > 5,
    confidenceScore,
    issues
  };
}
