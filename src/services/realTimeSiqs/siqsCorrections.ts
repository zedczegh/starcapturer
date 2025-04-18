
/**
 * SIQS Corrections
 * 
 * This module provides functions to correct physically impossible or anomalous SIQS results.
 */

import { SiqsResult, WeatherDataWithClearSky } from './siqsTypes';
import { hasCachedSiqs, getCachedSiqs } from './siqsCache';

// Thresholds for detecting anomalies in SIQS calculations
const MAX_SCORE_DELTA = 4.0; // Maximum reasonable change between calculations
const CRITICAL_WEATHER_THRESHOLD = 80; // Cloud cover % that requires low score

/**
 * Correct physically impossible SIQS scores based on weather conditions
 */
export function correctPhysicalImpossibilities(
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
export function ensureTemporalConsistency(
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
