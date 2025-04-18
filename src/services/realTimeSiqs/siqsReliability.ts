
/**
 * SIQS Data Reliability Assessment
 * 
 * This module evaluates the reliability of the data used for SIQS calculations.
 */

import { WeatherDataWithClearSky } from './siqsTypes';

/**
 * Check if SIQS calculation is likely to be reliable based on available data quality
 */
export function assessDataReliability(
  weatherData: WeatherDataWithClearSky | null,
  forecastData: any | null
): { 
  reliable: boolean;
  confidenceScore: number;
  issues: string[] 
} {
  const issues: string[] = [];
  let confidenceScore = 10;
  
  if (!weatherData) {
    issues.push("Missing weather data");
    confidenceScore -= 5;
  }
  
  if (!forecastData || !forecastData.hourly) {
    issues.push("Missing forecast data");
    confidenceScore -= 3;
  }
  
  if (weatherData && weatherData.time) {
    const weatherTimestamp = new Date(weatherData.time).getTime();
    const dataAge = (Date.now() - weatherTimestamp) / (60 * 1000);
    
    if (dataAge > 120) {
      issues.push(`Weather data is ${Math.round(dataAge)} minutes old`);
      confidenceScore -= Math.min(3, dataAge / 60);
    }
  }
  
  return {
    reliable: confidenceScore >= 6,
    confidenceScore: Math.max(0, Math.min(10, confidenceScore)),
    issues
  };
}
