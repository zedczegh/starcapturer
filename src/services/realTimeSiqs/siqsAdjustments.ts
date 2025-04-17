/**
 * SIQS adjustment functions for different factors
 */
import { ClimateRegion } from './siqsTypes';

/**
 * Adjust a score based on climate region
 * @param score Base score to adjust
 * @param factor Factor type ('cloudCover', 'humidity', or 'temperature')
 * @param region Climate region
 * @returns Adjusted score
 */
export function adjustForClimate(
  score: number, 
  factor: 'cloudCover' | 'humidity' | 'temperature', 
  region: ClimateRegion
): number {
  // Get the appropriate adjustment factor from the region
  const adjustmentFactor = region.adjustmentFactors[factor] || 1.0;
  
  // Apply the adjustment
  const adjustedScore = score * adjustmentFactor;
  
  // Keep the score within valid range (0-10)
  return Math.max(0, Math.min(10, adjustedScore));
}

/**
 * Adjust a score based on time of day and year
 * @param score Base score to adjust
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @returns Adjusted score
 */
export function adjustForTime(
  score: number,
  latitude: number,
  longitude: number
): number {
  // Get current date and time
  const now = new Date();
  const hour = now.getHours();
  const month = now.getMonth(); // 0-11
  
  // Time of day adjustment
  let timeOfDayFactor = 1.0;
  
  // Night hours generally have better seeing conditions
  if (hour >= 22 || hour <= 4) {
    timeOfDayFactor = 1.15; // Bonus for prime night hours
  } else if (hour >= 18 || hour <= 6) {
    timeOfDayFactor = 1.1; // Bonus for general night hours
  } else if (hour >= 10 && hour <= 16) {
    timeOfDayFactor = 0.9; // Penalty for middle of day
  }
  
  // Seasonal adjustment
  let seasonalFactor = 1.0;
  
  // Adjust based on hemisphere and season
  const isNorthernHemisphere = latitude >= 0;
  
  // Winter tends to have clearer skies in many regions
  // Summer can have more atmospheric turbulence
  if (isNorthernHemisphere) {
    // Northern hemisphere: winter=Dec-Feb (11,0,1), summer=Jun-Aug (5,6,7)
    if (month >= 11 || month <= 1) { // Winter
      seasonalFactor = 1.1;
    } else if (month >= 5 && month <= 7) { // Summer
      seasonalFactor = 0.95;
    }
  } else {
    // Southern hemisphere: winter=Jun-Aug (5,6,7), summer=Dec-Feb (11,0,1)
    if (month >= 5 && month <= 7) { // Winter
      seasonalFactor = 1.1;
    } else if (month >= 11 || month <= 1) { // Summer
      seasonalFactor = 0.95;
    }
  }
  
  // Apply both adjustments
  const adjustedScore = score * timeOfDayFactor * seasonalFactor;
  
  // Keep the score within valid range (0-10)
  return Math.max(0, Math.min(10, adjustedScore));
}

/**
 * Adjust score based on light pollution (Bortle scale)
 * @param score Base score to adjust
 * @param bortleScale Bortle scale (1-9)
 * @returns Adjusted score
 */
export function adjustForLight(score: number, bortleScale: number): number {
  // Ensure valid Bortle scale
  const bortle = Math.max(1, Math.min(9, bortleScale));
  
  // Calculate light pollution factor
  // Bortle 1 = 1.2 (bonus for excellent dark sky sites)
  // Bortle 5 = 1.0 (neutral)
  // Bortle 9 = 0.6 (heavy penalty for high light pollution)
  const lightFactor = 1.2 - ((bortle - 1) / 20);
  
  // Apply the adjustment
  const adjustedScore = score * lightFactor;
  
  // Keep the score within valid range (0-10)
  return Math.max(0, Math.min(10, adjustedScore));
}
