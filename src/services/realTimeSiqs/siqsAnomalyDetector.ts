
import { SiqsResult, WeatherDataWithClearSky } from './siqsTypes';

/**
 * Detects and fixes anomalies in SIQS calculations
 * 
 * @param result SIQS calculation result
 * @param weatherData Weather data for the location
 * @param location Coordinates of the location
 * @returns Corrected SIQS result
 */
export function detectAndFixAnomalies(
  result: SiqsResult,
  weatherData: WeatherDataWithClearSky,
  location: { latitude: number; longitude: number }
): SiqsResult {
  if (!result) return result;
  
  // Clone the result to avoid mutating the original
  const corrected = { ...result };
  
  // Fix unrealistically high SIQS scores
  if (corrected.siqs > 10) {
    corrected.siqs = Math.min(corrected.siqs, 10);
  }
  
  // Fix unrealistically low SIQS scores for dark sky reserves or remote areas
  if (result.isDarkSkyReserve && result.siqs < 5) {
    corrected.siqs = Math.max(result.siqs, 5);
  }
  
  // Fix inconsistencies between cloud cover and SIQS scores
  if (weatherData && typeof weatherData.cloudCover === 'number') {
    // Cloud cover is high but SIQS is also high
    if (weatherData.cloudCover > 80 && corrected.siqs > 7) {
      corrected.siqs = Math.min(corrected.siqs, 7);
    }
    
    // Cloud cover is very low but SIQS is low
    if (weatherData.cloudCover < 20 && corrected.siqs < 5 && !result.lightPollutionData?.isHighPollution) {
      corrected.siqs = Math.max(corrected.siqs, 5);
    }
  }
  
  return corrected;
}

/**
 * Assesses the reliability of data used for SIQS calculation
 * 
 * @param weatherData Weather data for the location
 * @param forecastData Optional forecast data
 * @returns Reliability assessment with confidence score
 */
export function assessDataReliability(
  weatherData?: WeatherDataWithClearSky,
  forecastData?: any
): { reliable: boolean; confidenceScore: number; issues: string[] } {
  const issues: string[] = [];
  let confidenceScore = 10;
  
  // Check if we have weather data
  if (!weatherData) {
    issues.push('Missing weather data');
    confidenceScore -= 3;
  } else {
    // Check for cloud cover data
    if (weatherData.cloudCover === undefined || weatherData.cloudCover === null) {
      issues.push('Missing cloud cover data');
      confidenceScore -= 2;
    }
    
    // Check for precipitation data
    if (weatherData.precipitation === undefined || weatherData.precipitation === null) {
      issues.push('Missing precipitation data');
      confidenceScore -= 1;
    }
  }
  
  // Check forecast data quality
  if (!forecastData) {
    issues.push('Missing forecast data');
    confidenceScore -= 2;
  } else if (forecastData.hourly && (!forecastData.hourly.cloud_cover || !forecastData.hourly.time)) {
    issues.push('Incomplete forecast data');
    confidenceScore -= 1;
  }
  
  // Ensure confidence score is within 1-10 range
  confidenceScore = Math.max(1, Math.min(10, confidenceScore));
  
  return {
    reliable: confidenceScore >= 7,
    confidenceScore,
    issues
  };
}
