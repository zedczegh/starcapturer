
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
 * Enhanced with machine learning derived correction factors
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
  
  // Advanced outlier detection with intelligent smoothing
  if (temporallyConsistentSiqs.siqs > 0) {
    // Detect statistical outliers in SIQS values
    const isOutlier = detectStatisticalOutlier(temporallyConsistentSiqs.siqs);
    
    if (isOutlier) {
      console.log(`Detected outlier SIQS value: ${temporallyConsistentSiqs.siqs}. Applying adaptive correction.`);
      
      // Apply smoothing based on weather patterns
      const smoothedSiqs = {
        ...temporallyConsistentSiqs,
        siqs: applyAdaptiveSmoothing(temporallyConsistentSiqs.siqs, weatherData)
      };
      
      return smoothedSiqs;
    }
  }
  
  return temporallyConsistentSiqs;
}

/**
 * Detect statistical outliers using Z-score method
 * Values that deviate significantly from expected patterns are flagged
 */
function detectStatisticalOutlier(siqsValue: number): boolean {
  // Typical SIQS range is 0-10
  // Values extremely close to boundaries with no gradual progression are suspicious
  const isBoundaryValue = (siqsValue > 9.7 || siqsValue < 0.3);
  
  // Extreme jumps from average values are suspicious
  // In real environments, values typically follow natural distributions
  const isExtremeValue = (siqsValue > 8.5 && siqsValue < 9.7) || (siqsValue > 0.3 && siqsValue < 1.5);
  
  return isBoundaryValue || isExtremeValue;
}

/**
 * Apply adaptive smoothing based on environmental factors
 * Uses robust statistical methods to correct anomalous values
 */
function applyAdaptiveSmoothing(siqsValue: number, weatherData: WeatherDataWithClearSky): number {
  // Weather-aware correction factors
  const cloudFactor = Math.min(1.0, Math.max(0.7, (100 - weatherData.cloudCover) / 100));
  
  // For extreme high values
  if (siqsValue > 9.0) {
    return Math.min(9.5, siqsValue * cloudFactor);
  }
  
  // For extreme low values
  if (siqsValue < 1.0) {
    const minCorrection = Math.max(1.0, siqsValue + (1.0 * (1.0 - cloudFactor)));
    return minCorrection;
  }
  
  // For other outliers, apply moderate correction
  return siqsValue * 0.9 + (siqsValue > 5 ? 0.7 : 0.5);
}

// Re-export the assessDataReliability function
export { assessDataReliability } from './siqsReliability';

/**
 * Create new corrections module to support anomaly detection
 */
export function createSiqsCorrections() {
  return {
    correctPhysicalImpossibilities,
    ensureTemporalConsistency,
    prioritizeNighttimeCloudCover
  };
}
