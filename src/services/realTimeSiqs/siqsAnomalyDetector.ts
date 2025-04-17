
import { SiqsResult, WeatherDataWithClearSky } from './siqsTypes';

/**
 * Detect and fix anomalies in SIQS calculation results
 */
export function detectAndFixAnomalies(
  result: SiqsResult,
  weatherData: WeatherDataWithClearSky,
  location: { latitude: number; longitude: number }
): SiqsResult {
  // Make a copy to avoid modifying the original
  const fixedResult = { ...result };
  
  // Check for impossibly high score with high cloud cover
  if (weatherData?.hourly?.cloudcover) {
    const avgCloudCover = getAverageValue(weatherData.hourly.cloudcover);
    if (avgCloudCover > 80 && result.siqs > 7) {
      console.log(`Anomaly detected: High SIQS (${result.siqs}) with high cloud cover (${avgCloudCover}%)`);
      fixedResult.siqs = Math.min(result.siqs, 5.0);
    }
  }
  
  // Add any detected anomalies to metadata
  const metadata = fixedResult.metadata || {
    calculatedAt: new Date().toISOString(),
    sources: { weather: true, forecast: false, clearSky: false, lightPollution: false }
  };
  
  return {
    ...fixedResult,
    metadata
  };
}

/**
 * Assess the reliability of the data used for SIQS calculation
 */
export function assessDataReliability(
  weatherData: WeatherDataWithClearSky | null,
  forecastData: any | null
): { confidenceScore: number; issues: string[] } {
  const issues: string[] = [];
  let confidenceScore = 100;
  
  // Check weather data
  if (!weatherData) {
    issues.push('No weather data available');
    confidenceScore -= 30;
  } else {
    // Check for completeness
    if (!weatherData.hourly?.cloudcover) {
      issues.push('Missing cloud cover data');
      confidenceScore -= 15;
    }
    
    if (!weatherData.hourly?.temperature_2m) {
      issues.push('Missing temperature data');
      confidenceScore -= 10;
    }
  }
  
  // Normalize score to 0-100 range
  confidenceScore = Math.max(0, Math.min(100, confidenceScore));
  
  return { confidenceScore, issues };
}

/**
 * Calculate the average value from an array of numbers
 */
function getAverageValue(values: number[]): number {
  if (!values || values.length === 0) return 0;
  const sum = values.reduce((total, val) => total + val, 0);
  return sum / values.length;
}
