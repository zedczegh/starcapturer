
/**
 * SIQS Anomaly Detection
 * 
 * This module provides advanced tools to detect and correct unexpected
 * or anomalous results in SIQS calculations, ensuring extremely high reliability.
 */

import { SiqsResult, WeatherDataWithClearSky } from './siqsTypes';
import { hasCachedSiqs, getCachedSiqs } from './siqsCache';

// Thresholds for detecting anomalies in SIQS calculations
const MAX_SCORE_DELTA = 4.0; // Maximum reasonable change between calculations
const CRITICAL_WEATHER_THRESHOLD = 80; // Cloud cover % that requires low score

/**
 * Detect and fix anomalies in SIQS calculation results
 * 
 * @param siqs Calculated SIQS result
 * @param weatherData Weather data used in calculation
 * @param location Location coordinates
 * @returns Corrected SIQS result
 */
export function detectAndFixAnomalies(
  siqs: SiqsResult,
  weatherData: WeatherDataWithClearSky,
  location: { latitude: number; longitude: number }
): SiqsResult {
  // Don't process already invalid results
  if (!siqs || siqs.siqs <= 0) {
    return siqs;
  }

  const { latitude, longitude } = location;

  // Check for physical impossibilities
  const correctedSiqs = correctPhysicalImpossibilities(siqs, weatherData);
  
  // Check for temporal consistency with previous calculations
  const temporallyConsistentSiqs = ensureTemporalConsistency(correctedSiqs, latitude, longitude);
  
  // Check for spatial consistency with nearby locations
  // This would require additional location data which we may not have
  
  return temporallyConsistentSiqs;
}

/**
 * Correct physically impossible SIQS scores based on weather conditions
 */
function correctPhysicalImpossibilities(
  siqs: SiqsResult, 
  weatherData: WeatherDataWithClearSky
): SiqsResult {
  const result = { ...siqs };
  
  // High cloud cover should prevent high SIQS scores
  if (weatherData.cloudCover >= CRITICAL_WEATHER_THRESHOLD && siqs.siqs > 5) {
    console.log(`Anomaly detected: ${weatherData.cloudCover}% cloud cover but SIQS ${siqs.siqs.toFixed(1)}`);
    
    // Apply cloud-based correction
    const correctedScore = Math.min(siqs.siqs, 10 - (weatherData.cloudCover / 20));
    
    result.siqs = Math.round(correctedScore * 10) / 10;
    result.isViable = result.siqs >= 2.0;
    
    console.log(`Corrected to ${result.siqs.toFixed(1)} based on physical impossibility`);
  }
  
  // Active precipitation should limit maximum score
  if (weatherData.precipitation > 0 && siqs.siqs > 6) {
    const correctedScore = Math.min(siqs.siqs, 6.0);
    
    result.siqs = Math.round(correctedScore * 10) / 10;
    result.isViable = result.siqs >= 2.0;
    
    console.log(`Corrected SIQS from ${siqs.siqs.toFixed(1)} to ${result.siqs.toFixed(1)} due to active precipitation`);
  }
  
  return result;
}

/**
 * Ensure temporal consistency with previous calculations
 */
function ensureTemporalConsistency(
  siqs: SiqsResult,
  latitude: number,
  longitude: number
): SiqsResult {
  // Check if we have a previous calculation to compare against
  if (hasCachedSiqs(latitude, longitude, 120)) {
    const previousSiqs = getCachedSiqs(latitude, longitude);
    
    if (previousSiqs && Math.abs(previousSiqs.siqs - siqs.siqs) > MAX_SCORE_DELTA) {
      console.log(`Anomaly detected: SIQS changed by ${Math.abs(previousSiqs.siqs - siqs.siqs).toFixed(1)} points`);
      
      // Calculate a more reasonable transition
      const direction = siqs.siqs > previousSiqs.siqs ? 1 : -1;
      const allowedChange = MAX_SCORE_DELTA * direction;
      const smoothedScore = previousSiqs.siqs + allowedChange;
      
      // Create a smoothed result
      const result = { ...siqs };
      result.siqs = Math.round(smoothedScore * 10) / 10;
      result.isViable = result.siqs >= 2.0;
      
      console.log(`Smoothed SIQS from ${siqs.siqs.toFixed(1)} to ${result.siqs.toFixed(1)} for temporal consistency`);
      return result;
    }
  }
  
  return siqs;
}

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
  
  // Check critical data presence
  if (!weatherData) {
    issues.push("Missing weather data");
    confidenceScore -= 5;
  }
  
  if (!forecastData || !forecastData.hourly) {
    issues.push("Missing forecast data");
    confidenceScore -= 3;
  }
  
  // Check data freshness if available
  if (weatherData && weatherData.time) {
    const weatherTimestamp = new Date(weatherData.time).getTime();
    const now = Date.now();
    const dataAge = (now - weatherTimestamp) / (60 * 1000); // minutes
    
    if (dataAge > 120) {
      issues.push(`Weather data is ${Math.round(dataAge)} minutes old`);
      confidenceScore -= Math.min(3, dataAge / 60); // Reduce confidence based on age, up to 3 points
    }
  }
  
  return {
    reliable: confidenceScore >= 6,
    confidenceScore: Math.max(0, Math.min(10, confidenceScore)),
    issues
  };
}

