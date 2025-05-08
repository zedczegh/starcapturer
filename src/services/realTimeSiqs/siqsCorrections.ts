
/**
 * SIQS Correction Utilities
 * 
 * This module provides functions to correct and validate SIQS calculations,
 * ensuring physically sensible results even with unreliable input data.
 */

import { SiqsResult, WeatherDataWithClearSky } from './siqsTypes';
import { logWarning } from '@/utils/debug/errorLogger';

/**
 * Correct physical impossibilities in SIQS results
 * @param siqs The SIQS result to correct
 * @param weatherData The weather data used for calculation
 * @returns Corrected SIQS result
 */
export function correctPhysicalImpossibilities(
  siqs: SiqsResult,
  weatherData: WeatherDataWithClearSky
): SiqsResult {
  if (!siqs) return siqs;
  
  const correctedSiqs = { ...siqs };
  
  // If cloud cover is very high, ensure SIQS is appropriately low
  if (weatherData.cloudCover > 90 && correctedSiqs.siqs > 5) {
    logWarning(`Correcting anomalous high SIQS (${correctedSiqs.siqs}) with high cloud cover (${weatherData.cloudCover}%)`);
    correctedSiqs.siqs = Math.min(correctedSiqs.siqs, 5);
    
    // Also adjust factors
    if (correctedSiqs.factors) {
      correctedSiqs.factors = correctedSiqs.factors.map(factor => {
        if (factor.name === 'Cloud Cover') {
          return { ...factor, score: Math.min(factor.score, 5) };
        }
        return factor;
      });
    }
  }
  
  // If precipitation exists, ensure SIQS is appropriately affected
  if (weatherData.precipitation && weatherData.precipitation > 1 && correctedSiqs.siqs > 6) {
    logWarning(`Correcting anomalous high SIQS (${correctedSiqs.siqs}) with precipitation (${weatherData.precipitation}mm)`);
    correctedSiqs.siqs = Math.min(correctedSiqs.siqs, 6);
  }
  
  // Ensure the SIQS is in the valid range
  correctedSiqs.siqs = Math.max(0, Math.min(10, correctedSiqs.siqs));
  
  // Update viability flag
  correctedSiqs.isViable = correctedSiqs.siqs >= 3.0;
  
  return correctedSiqs;
}

/**
 * Ensure temporal consistency with past calculations
 * @param siqs The SIQS result to check
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @returns Temporally consistent SIQS result
 */
export function ensureTemporalConsistency(
  siqs: SiqsResult,
  latitude: number,
  longitude: number
): SiqsResult {
  // In a real implementation, we'd check against historical values
  // This is a placeholder for the functionality
  return siqs;
}

/**
 * Prioritize nighttime cloud cover in SIQS calculation
 * @param siqs The SIQS result to adjust
 * @param weatherData The weather data used for calculation
 * @returns SIQS result with priority given to nighttime data
 */
export function prioritizeNighttimeCloudCover(
  siqs: SiqsResult,
  weatherData: WeatherDataWithClearSky
): SiqsResult {
  if (!siqs || !weatherData.nighttimeCloudData) return siqs;
  
  // If there's a significant difference between daytime and nighttime cloud cover,
  // adjust the SIQS to better reflect nighttime conditions
  const dayCloudCover = weatherData.cloudCover;
  const nightCloudCover = weatherData.nighttimeCloudData.average;
  const difference = Math.abs(dayCloudCover - nightCloudCover);
  
  if (difference > 30) {
    logWarning(`Large difference between day (${dayCloudCover}%) and night (${nightCloudCover}%) cloud cover. Adjusting SIQS.`);
    
    // A simple adjustment algorithm - can be refined based on actual data analysis
    const adjustmentFactor = nightCloudCover < dayCloudCover ? 1.1 : 0.9;
    const adjustedSiqs = { ...siqs };
    adjustedSiqs.siqs = Math.max(0, Math.min(10, adjustedSiqs.siqs * adjustmentFactor));
    
    return adjustedSiqs;
  }
  
  return siqs;
}
