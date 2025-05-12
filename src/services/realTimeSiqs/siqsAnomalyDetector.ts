
/**
 * SIQS Anomaly Detection
 * 
 * This module provides advanced tools to detect and correct unexpected
 * or anomalous results in SIQS calculations, ensuring extremely high reliability.
 */

import { SiqsResult, WeatherDataWithClearSky } from './siqsTypes';
import { 
  correctPhysicalImpossibilities, 
  ensureTemporalConsistency,
  prioritizeNighttimeCloudCover
} from './siqsCorrections';
import { assessDataReliability } from './siqsReliability';

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
  
  // Enhanced processing pipeline with nighttime prioritization
  const nighttimeAdjustedSiqs = prioritizeNighttimeCloudCover(siqs, weatherData);
  const correctedSiqs = correctPhysicalImpossibilities(nighttimeAdjustedSiqs, weatherData);
  const temporallyConsistentSiqs = ensureTemporalConsistency(correctedSiqs, latitude, longitude);
  
  return temporallyConsistentSiqs;
}

// Re-export the assessDataReliability function
export { assessDataReliability } from './siqsReliability';
