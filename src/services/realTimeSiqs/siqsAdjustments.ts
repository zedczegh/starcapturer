
/**
 * SIQS adjustment functions for environmental factors
 */

import { ClimateRegion } from './siqsTypes';

/**
 * Adjust score based on climate region
 * @param score - Base score (0-10)
 * @param factor - Factor type (cloudCover, humidity, temperature)
 * @param region - Climate region information
 * @returns Adjusted score (0-10)
 */
export function adjustForClimate(
  score: number, 
  factor: 'cloudCover' | 'humidity' | 'temperature', 
  region?: ClimateRegion | null
): number {
  if (!region) return score;
  
  // Get adjustment factor index based on factor type
  let adjustmentIndex = 0;
  switch (factor) {
    case 'cloudCover': adjustmentIndex = 0; break;
    case 'humidity': adjustmentIndex = 1; break;
    case 'temperature': adjustmentIndex = 2; break;
  }
  
  // Apply regional adjustment factor
  const adjustmentFactor = region.adjustmentFactors[adjustmentIndex] || 1.0;
  return Math.min(10, Math.max(0, score * adjustmentFactor));
}

/**
 * Adjust score based on time of day and year
 * @param score - Base score (0-10)
 * @param latitude - Location latitude
 * @param longitude - Location longitude
 * @returns Adjusted score (0-10)
 */
export function adjustForTime(
  score: number, 
  latitude: number, 
  longitude: number
): number {
  try {
    // Determine current season based on latitude and month
    const now = new Date();
    const month = now.getMonth(); // 0-11 (Jan-Dec)
    
    // Northern hemisphere: summer (5-8), winter (11-2)
    // Southern hemisphere: opposite
    const isNorthernHemisphere = latitude >= 0;
    const isSummerMonth = isNorthernHemisphere ? 
      (month >= 5 && month <= 8) : 
      (month <= 2 || month >= 11);
    
    // Summer tends to have better conditions in most regions
    // Simple seasonal adjustment
    const seasonalFactor = isSummerMonth ? 1.05 : 0.95;
    
    // Time of day adjustment - better at night
    const hour = now.getHours();
    const isDaytime = hour >= 6 && hour <= 18;
    
    // During daytime, cloud detection is easier but viewing conditions less relevant
    // At night, account for multiple factors
    const timeOfDayFactor = isDaytime ? 1.0 : 1.1;
    
    return Math.min(10, Math.max(0, score * seasonalFactor * timeOfDayFactor));
  } catch (error) {
    console.error("Error in time adjustment:", error);
    return score;
  }
}

/**
 * Adjust score based on light pollution (Bortle scale)
 * @param score - Base combined score (0-10)
 * @param bortleScale - Bortle scale value (1-9)
 * @returns Adjusted score (0-10)
 */
export function adjustForLight(
  score: number, 
  bortleScale: number
): number {
  // Validate Bortle scale input
  const validBortle = Math.min(9, Math.max(1, bortleScale));
  
  // Calculate light pollution factor
  // Bortle 1 (best) → 1.2
  // Bortle 5 (average) → 1.0
  // Bortle 9 (worst) → 0.6
  const lightFactor = 1.2 - ((validBortle - 1) * 0.075);
  
  return Math.min(10, Math.max(0, score * lightFactor));
}

