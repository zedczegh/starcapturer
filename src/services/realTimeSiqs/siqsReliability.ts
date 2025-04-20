
/**
 * SIQS Reliability Assessment
 * 
 * This module evaluates the reliability of weather data used for SIQS calculations
 * to detect potential inaccuracies and provide confidence scores.
 */

import { WeatherDataWithClearSky } from './siqsTypes';

interface ReliabilityResult {
  confidenceScore: number; // 0-100
  issues: string[];
}

/**
 * Assess reliability of weather data with anomaly and inconsistency detection
 */
export function assessDataReliability(
  weatherData: WeatherDataWithClearSky,
  forecastData: any | null
): ReliabilityResult {
  const issues: string[] = [];
  let confidence = 100; // Start with perfect confidence
  
  // Check for missing critical data
  if (weatherData.cloudCover === undefined) {
    issues.push('Missing cloud cover data');
    confidence -= 40;
  }
  
  // Check for implausible values
  if (weatherData.cloudCover !== undefined) {
    if (weatherData.cloudCover < 0 || weatherData.cloudCover > 100) {
      issues.push('Cloud cover value outside valid range');
      confidence -= 30;
    }
    
    // Check for suspiciously perfect values
    if (weatherData.cloudCover === 0 || weatherData.cloudCover === 100) {
      issues.push('Suspicious boundary cloud cover value');
      confidence -= 10;
    }
  }
  
  // Check for night vs day inconsistencies
  if (weatherData.nighttimeCloudData && weatherData.cloudCover !== undefined) {
    const nightCloudAvg = weatherData.nighttimeCloudData.average;
    const difference = Math.abs(weatherData.cloudCover - nightCloudAvg);
    
    if (difference > 40) {
      issues.push('High discrepancy between current and nighttime cloud cover');
      confidence -= 20;
    }
  }
  
  // Check forecast data for inconsistencies
  if (forecastData && forecastData.hourly) {
    const hourlyCloudCover = forecastData.hourly.cloudcover || [];
    
    if (hourlyCloudCover.length > 0) {
      // Calculate variance in forecasted cloud cover
      const values = hourlyCloudCover.slice(0, 8); // Look at next 8 hours
      const avg = values.reduce((sum: number, val: number) => sum + val, 0) / values.length;
      const variance = values.reduce((sum: number, val: number) => sum + Math.pow(val - avg, 2), 0) / values.length;
      
      // Suspiciously constant forecasts
      if (variance < 1 && values.length > 3) {
        issues.push('Suspiciously constant forecast data');
        confidence -= 15;
      }
      
      // Highly erratic forecasts
      if (variance > 800) {
        issues.push('Highly erratic forecast data');
        confidence -= 10;
      }
    }
  }
  
  // Check for data freshness
  if (weatherData.time) {
    const dataTime = new Date(weatherData.time).getTime();
    const now = Date.now();
    const dataAgeHours = (now - dataTime) / (1000 * 60 * 60);
    
    if (dataAgeHours > 3) {
      issues.push('Weather data is more than 3 hours old');
      confidence -= 20;
    } else if (dataAgeHours > 1) {
      issues.push('Weather data is more than 1 hour old');
      confidence -= 5;
    }
  }
  
  // Add source quality factor
  if (weatherData.sourceQuality === 'high') {
    confidence = Math.min(100, confidence + 5);
  } else if (weatherData.sourceQuality === 'low') {
    issues.push('Low quality data source');
    confidence -= 10;
  }
  
  // Ensure confidence stays in valid range
  confidence = Math.max(0, Math.min(100, confidence));
  
  return {
    confidenceScore: confidence,
    issues
  };
}

/**
 * Check if weather data shows consistency across multiple dimensions
 */
export function checkDataConsistency(weatherData: WeatherDataWithClearSky): boolean {
  // Check cloud cover vs other weather parameters consistency
  if (weatherData.cloudCover !== undefined && weatherData.precipitation !== undefined) {
    // High clouds with no precipitation is consistent
    // Low clouds with precipitation is consistent
    // Inconsistent pattern: low clouds with high precipitation or vice versa
    const isInconsistent = (weatherData.cloudCover < 30 && weatherData.precipitation > 1) ||
                          (weatherData.cloudCover > 80 && weatherData.precipitation === 0);
    
    if (isInconsistent) {
      return false;
    }
  }
  
  // More consistency checks can be added here
  
  return true;
}

/**
 * Get recommended adjustments based on reliability assessment
 */
export function getReliabilityAdjustments(reliability: ReliabilityResult): {
  siqsAdjustment: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  let siqsAdjustment = 0;
  
  if (reliability.confidenceScore < 50) {
    siqsAdjustment = -1;
    recommendations.push('Consider onsite visual observation due to low data reliability');
  } else if (reliability.confidenceScore < 70) {
    siqsAdjustment = -0.5;
    recommendations.push('Cross-check with local observations recommended');
  } else if (reliability.confidenceScore < 85) {
    siqsAdjustment = -0.2;
    recommendations.push('Generally reliable data with minor concerns');
  }
  
  return {
    siqsAdjustment,
    recommendations
  };
}
