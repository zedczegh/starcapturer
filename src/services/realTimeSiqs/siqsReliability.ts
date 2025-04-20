
/**
 * SIQS Reliability Assessment
 * 
 * This module provides tools to assess the reliability of SIQS calculations
 * based on available data quality and completeness.
 */

import { WeatherDataWithClearSky } from './siqsTypes';

interface ReliabilityResult {
  reliable: boolean;
  issues: string[];
  confidenceScore: number; // 0-10 scale
}

/**
 * Assess the reliability of data used for SIQS calculation
 */
export function assessDataReliability(
  weatherData?: WeatherDataWithClearSky,
  forecastData?: any
): ReliabilityResult {
  const issues: string[] = [];
  let confidenceScore = 10;
  
  // Check if we have weather data
  if (!weatherData) {
    issues.push("Missing weather data");
    confidenceScore -= 5;
  } else {
    // Check for critical weather data fields
    if (weatherData.cloudCover === undefined) {
      issues.push("Missing cloud cover data");
      confidenceScore -= 3;
    }
    
    if (weatherData.humidity === undefined) {
      issues.push("Missing humidity data");
      confidenceScore -= 1;
    }
    
    if (weatherData.temperature === undefined) {
      issues.push("Missing temperature data");
      confidenceScore -= 1;
    }
    
    // Check for nighttime cloud data which is critical for good SIQS
    if (!weatherData.nighttimeCloudData || 
        weatherData.nighttimeCloudData.average === undefined) {
      issues.push("Missing nighttime cloud data");
      confidenceScore -= 2.5;
    } else {
      // Check source of nighttime cloud data - forecast is more reliable than calculated
      if (weatherData.nighttimeCloudData.sourceType === 'calculated') {
        issues.push("Using calculated nighttime cloud data");
        confidenceScore -= 0.5;
      }
    }
    
    // Check if there's precipitation which can affect reliability
    if (weatherData.precipitation && weatherData.precipitation > 1) {
      issues.push("Precipitation detected");
      confidenceScore -= 1;
    }
  }
  
  // Check forecast data availability
  if (!forecastData) {
    issues.push("Missing forecast data");
    confidenceScore -= 2;
  } else if (!Array.isArray(forecastData) || forecastData.length === 0) {
    issues.push("Invalid forecast data format");
    confidenceScore -= 2;
  }
  
  // Ensure confidence score is within bounds
  confidenceScore = Math.max(0, Math.min(10, confidenceScore));
  
  return {
    reliable: confidenceScore > 6,
    issues,
    confidenceScore
  };
}

/**
 * Get confidence level description based on score
 */
export function getConfidenceDescription(score: number): string {
  if (score >= 9) return "Very High";
  if (score >= 7) return "High";
  if (score >= 5) return "Moderate";
  if (score >= 3) return "Low";
  return "Very Low";
}

