
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
  
  // If temperature is extremely cold (<-20°C), reduce SIQS slightly due to viewing difficulty
  if (weatherData.temperature < -20 && correctedSiqs.siqs > 7) {
    logWarning(`Adjusting SIQS for extreme cold temperature (${weatherData.temperature}°C)`);
    correctedSiqs.siqs = Math.min(correctedSiqs.siqs, 7);
  }
  
  // If wind speed is very high (>30 km/h), reduce SIQS due to telescope stability issues
  if (weatherData.windSpeed > 30 && correctedSiqs.siqs > 7) {
    logWarning(`Adjusting SIQS for high wind conditions (${weatherData.windSpeed} km/h)`);
    correctedSiqs.siqs = Math.min(correctedSiqs.siqs, 7);
  }
  
  // If humidity is extremely high (>90%), reduce SIQS due to dewing issues
  if (weatherData.humidity > 90 && correctedSiqs.siqs > 6.5) {
    logWarning(`Adjusting SIQS for high humidity conditions (${weatherData.humidity}%)`);
    correctedSiqs.siqs = Math.min(correctedSiqs.siqs, 6.5);
  }
  
  // Ensure the SIQS is in the valid range
  correctedSiqs.siqs = Math.max(0, Math.min(10, correctedSiqs.siqs));
  
  // Update viability flag
  correctedSiqs.isViable = correctedSiqs.siqs >= 3.0;
  
  // Update level based on corrected score
  if (correctedSiqs.siqs >= 8) correctedSiqs.level = 'excellent';
  else if (correctedSiqs.siqs >= 6) correctedSiqs.level = 'good';
  else if (correctedSiqs.siqs >= 4) correctedSiqs.level = 'average';
  else if (correctedSiqs.siqs >= 2) correctedSiqs.level = 'poor';
  else correctedSiqs.level = 'bad';
  
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

/**
 * Apply seasonal corrections based on time of year and location
 * @param siqs The SIQS result to adjust
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @returns Seasonally-corrected SIQS result
 */
export function applySeasonalCorrections(
  siqs: SiqsResult,
  latitude: number, 
  longitude: number
): SiqsResult {
  if (!siqs) return siqs;
  
  const currentMonth = new Date().getMonth(); // 0-11
  const isNorthernHemisphere = latitude >= 0;
  
  // Simple seasonal adjustments
  let seasonalFactor = 1.0;
  
  // Northern Hemisphere: Winter better, summer worse
  // Southern Hemisphere: opposite
  if (isNorthernHemisphere) {
    // Winter months (Nov-Feb in Northern)
    if (currentMonth <= 1 || currentMonth >= 10) {
      seasonalFactor = 1.05;
    }
    // Summer months (Jun-Aug in Northern)
    else if (currentMonth >= 5 && currentMonth <= 7) {
      seasonalFactor = 0.95; 
    }
  } else {
    // Winter months (May-Aug in Southern)
    if (currentMonth >= 4 && currentMonth <= 7) {
      seasonalFactor = 1.05;
    }
    // Summer months (Dec-Feb in Southern)
    else if (currentMonth <= 1 || currentMonth === 11) {
      seasonalFactor = 0.95;
    }
  }
  
  // Apply seasonal correction
  const correctedSiqs = { ...siqs };
  correctedSiqs.siqs = Math.max(0, Math.min(10, correctedSiqs.siqs * seasonalFactor));
  
  return correctedSiqs;
}
