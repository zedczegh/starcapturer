
/**
 * Enhanced SIQS Anomaly Detector and Data Reliability Assessment
 * 
 * This module provides tools to detect and fix anomalies in SIQS calculations
 * and assess the reliability of weather data used for those calculations.
 */

import { SiqsResult, WeatherDataWithClearSky } from './siqsTypes';

interface LocationData {
  latitude: number;
  longitude: number;
}

interface DataReliability {
  reliable: boolean;
  confidenceScore: number; // 0-10 scale
  issues: string[];
}

/**
 * Detect and fix anomalies in SIQS calculation results
 */
export function detectAndFixAnomalies(
  result: SiqsResult,
  weatherData: WeatherDataWithClearSky,
  location: LocationData
): SiqsResult {
  // Clone the result to avoid modifying the original
  const correctedResult: SiqsResult = {
    ...result,
    factors: [...(result.factors || [])],
  };
  
  // Don't touch scores that are already in the correct range
  if (result.siqs >= 0 && result.siqs <= 10) {
    return correctedResult;
  }
  
  // Fix for abnormally high SIQS scores (scaling issue)
  if (result.siqs > 10) {
    console.log(`Anomaly detected: SIQS score ${result.siqs} is above 10, normalizing`);
    correctedResult.siqs = result.siqs / 10;
    
    // Also normalize factor scores if they're disproportionately high
    if (correctedResult.factors) {
      correctedResult.factors = correctedResult.factors.map(factor => ({
        ...factor,
        score: factor.score > 10 ? factor.score / 10 : factor.score
      }));
    }
  }
  
  // Fix for negative SIQS scores
  if (result.siqs < 0) {
    console.log(`Anomaly detected: SIQS score ${result.siqs} is negative, fixing`);
    correctedResult.siqs = 0;
  }
  
  // Check for weather data inconsistencies
  if (weatherData) {
    // Check for unrealistic cloud cover
    if (weatherData.cloudCover !== undefined && weatherData.cloudCover > 100) {
      console.log(`Anomaly detected: Cloud cover ${weatherData.cloudCover}% exceeds 100%, capping`);
      weatherData.cloudCover = 100;
      
      // Update factors if present
      if (correctedResult.factors) {
        const cloudCoverFactor = correctedResult.factors.find(f => f.name === 'Cloud Cover');
        if (cloudCoverFactor) {
          cloudCoverFactor.score = 0; // Worst score for 100% cloud cover
          cloudCoverFactor.description = `Cloud Cover: 100% (capped)`;
        }
      }
    }
  }
  
  // Ensure SIQS is within 0-10 range
  correctedResult.siqs = Math.max(0, Math.min(10, correctedResult.siqs));
  
  // Recalculate viability based on corrected score
  correctedResult.isViable = correctedResult.siqs >= 3.0 && 
                             (!weatherData.cloudCover || weatherData.cloudCover < 70) && 
                             (!weatherData.precipitation || weatherData.precipitation === 0);
  
  return correctedResult;
}

/**
 * Assess reliability of weather/forecast data used for SIQS calculations
 */
export function assessDataReliability(
  weatherData: WeatherDataWithClearSky | null,
  forecastData: any | null
): DataReliability {
  const issues: string[] = [];
  let confidenceScore = 10;
  
  if (!weatherData) {
    issues.push("Missing weather data");
    confidenceScore -= 5;
  } else {
    // Check for missing critical weather parameters
    if (weatherData.cloudCover === undefined) {
      issues.push("Missing cloud cover data");
      confidenceScore -= 3;
    }
    
    if (weatherData.humidity === undefined) {
      issues.push("Missing humidity data");
      confidenceScore -= 1;
    }
    
    if (weatherData.windSpeed === undefined) {
      issues.push("Missing wind speed data");
      confidenceScore -= 1;
    }
  }
  
  // Check forecast data quality
  if (!forecastData) {
    issues.push("No forecast data available");
    confidenceScore -= 2;
  } else if (!forecastData.hourly || !forecastData.hourly.cloud_cover) {
    issues.push("Incomplete forecast data");
    confidenceScore -= 1.5;
  }
  
  // Check if data is stale
  if (weatherData && weatherData.timestamp) {
    const currentTime = Date.now();
    const dataTime = typeof weatherData.timestamp === 'string' ? 
                    new Date(weatherData.timestamp).getTime() : 
                    weatherData.timestamp;
    const dataAge = currentTime - dataTime;
    const hoursSinceUpdate = dataAge / (1000 * 60 * 60);
    
    if (hoursSinceUpdate > 3) {
      issues.push(`Weather data is ${Math.round(hoursSinceUpdate)} hours old`);
      confidenceScore -= Math.min(4, hoursSinceUpdate / 2);
    }
  } else if (weatherData) {
    issues.push("Weather data timestamp missing");
    confidenceScore -= 1;
  }
  
  // Ensure confidence score stays within 0-10 range
  confidenceScore = Math.max(0, Math.min(10, confidenceScore));
  
  return {
    reliable: confidenceScore >= 7,
    confidenceScore,
    issues
  };
}

/**
 * Determine final SIQS score based on reliability assessment
 */
export function getFinalSiqsScore(
  rawScore: number, 
  reliability: DataReliability
): number {
  // For high-confidence data, keep the raw score
  if (reliability.confidenceScore >= 8) {
    return rawScore;
  }
  
  // For medium to low confidence, apply a penalty based on confidence
  const confidencePenalty = (10 - reliability.confidenceScore) / 10;
  const adjustedScore = rawScore * (1 - (confidencePenalty * 0.3));
  
  // Ensure final score is in the correct range
  return Math.max(0, Math.min(10, adjustedScore));
}
