
/**
 * Advanced adjustments for SIQS calculations
 */

import { findClimateRegion, getClimateAdjustmentFactor } from './climateRegions';

/**
 * Apply intelligent adjustments to SIQS score based on location factors
 */
export function applyIntelligentAdjustments(
  siqsScore: number,
  latitude: number,
  longitude: number,
  weatherData?: any
): number {
  // Find climate region for this location
  const region = findClimateRegion(latitude, longitude);
  
  // Get base adjustment factor
  const baseFactor = getClimateAdjustmentFactor(region);
  
  // Adjust for altitude if available
  let altitudeFactor = 1.0;
  if (weatherData?.altitude) {
    // Higher altitudes generally have better viewing conditions
    const altitude = weatherData.altitude;
    if (altitude > 2000) {
      altitudeFactor = 1.15; // Significant improvement
    } else if (altitude > 1000) {
      altitudeFactor = 1.1; // Moderate improvement
    } else if (altitude > 500) {
      altitudeFactor = 1.05; // Slight improvement
    }
  }
  
  // Adjust for latitude (polar regions have different night conditions)
  let latitudeFactor = 1.0;
  const absLatitude = Math.abs(latitude);
  if (absLatitude > 60) {
    // Near polar regions have unique light conditions
    const month = new Date().getMonth(); // 0-11
    
    // Northern hemisphere summer / Southern hemisphere winter
    if ((latitude > 0 && month >= 4 && month <= 8) || 
        (latitude < 0 && (month <= 2 || month >= 9))) {
      latitudeFactor = 0.85; // Less darkness in summer
    } else {
      latitudeFactor = 1.1; // More darkness in winter
    }
  }
  
  // Apply all adjustments
  const adjustedScore = siqsScore * baseFactor * altitudeFactor * latitudeFactor;
  
  // Ensure score stays in valid range (0-10)
  return Math.max(0, Math.min(10, adjustedScore));
}
