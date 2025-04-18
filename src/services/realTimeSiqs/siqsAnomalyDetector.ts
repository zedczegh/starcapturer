
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
 */
export function detectAndFixAnomalies(
  siqs: SiqsResult,
  weatherData: WeatherDataWithClearSky,
  location: { latitude: number; longitude: number }
): SiqsResult {
  if (!siqs || siqs.siqs <= 0) {
    return siqs;
  }

  const { latitude, longitude } = location;
  const correctedSiqs = correctPhysicalImpossibilities(siqs, weatherData);
  const temporallyConsistentSiqs = ensureTemporalConsistency(correctedSiqs, latitude, longitude);
  
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
    const correctedScore = Math.min(siqs.siqs, 10 - (weatherData.cloudCover / 20));
    result.siqs = Math.round(correctedScore * 10) / 10;
    result.isViable = result.siqs >= 2.0;
  }
  
  // Active precipitation should limit maximum score
  if (weatherData.precipitation > 0 && siqs.siqs > 6) {
    result.siqs = Math.round(Math.min(siqs.siqs, 6.0) * 10) / 10;
    result.isViable = result.siqs >= 2.0;
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
  if (hasCachedSiqs(latitude, longitude)) {
    const previousSiqs = getCachedSiqs(latitude, longitude);
    
    if (previousSiqs && Math.abs(previousSiqs.siqs - siqs.siqs) > MAX_SCORE_DELTA) {
      const direction = siqs.siqs > previousSiqs.siqs ? 1 : -1;
      const allowedChange = MAX_SCORE_DELTA * direction;
      const smoothedScore = previousSiqs.siqs + allowedChange;
      
      const result = { ...siqs };
      result.siqs = Math.round(smoothedScore * 10) / 10;
      result.isViable = result.siqs >= 2.0;
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
