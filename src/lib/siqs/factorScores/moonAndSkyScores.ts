
/**
 * Moon phase and clear sky score calculations
 */

/**
 * Calculate the moon phase factor score
 * @param moonPhase Moon phase (0-1, 0 = new moon, 1 = full moon)
 * @returns Score on a 0-100 scale
 */
export function calculateMoonScore(moonPhase: number): number {
  // Validate input
  if (typeof moonPhase !== 'number' || isNaN(moonPhase)) {
    console.warn('Invalid moon phase value:', moonPhase);
    return 50; // Default to moderate score for invalid input
  }
  
  // Ensure moon phase is within 0-1 range
  const validMoonPhase = Math.max(0, Math.min(1, moonPhase));
  
  // Moon phase impact calculation - inverse relation (new moon is best)
  // New moon (0-0.05): Excellent (95-100)
  // Crescent moon (0.05-0.25): Very good (75-95)
  // Quarter moon (0.25-0.5): Good (60-75)
  // Gibbous moon (0.5-0.75): Fair (40-60)
  // Full or nearly full moon (0.75-1): Poor (0-40)
  
  return Math.round(100 - (validMoonPhase * 100));
}

/**
 * Calculate the clear sky rate factor score
 * @param clearSkyRate Clear sky rate percentage (0-100)
 * @returns Score on a 0-100 scale
 */
export function calculateClearSkyScore(clearSkyRate: number): number {
  // Validate input
  if (typeof clearSkyRate !== 'number' || isNaN(clearSkyRate)) {
    console.warn('Invalid clear sky rate value:', clearSkyRate);
    return 50; // Default to moderate score for invalid input
  }
  
  // Ensure rate is within 0-100 range
  const validRate = Math.max(0, Math.min(100, clearSkyRate));
  
  // Direct mapping - higher clear sky rate = higher score
  return validRate;
}

/**
 * Calculate the terrain factor score (elevation benefit)
 * @param elevation Elevation in meters
 * @returns Score on a 0-100 scale
 */
export function calculateTerrainFactor(elevation: number): number {
  // Validate input
  if (typeof elevation !== 'number' || isNaN(elevation)) {
    console.warn('Invalid elevation value:', elevation);
    return 50; // Default to moderate score for invalid input
  }
  
  // Ensure elevation is not negative
  const validElevation = Math.max(0, elevation);
  
  // Elevation impact calculation
  // 0-300m: Minimal impact (50-55)
  // 300-1000m: Modest improvement (55-70)
  // 1000-2000m: Significant improvement (70-85)
  // 2000-3000m: Major improvement (85-95)
  // 3000m+: Excellent (95-100)
  
  if (validElevation <= 300) return 50 + (validElevation / 60);           // 50-55
  if (validElevation <= 1000) return 55 + ((validElevation - 300) / 35);  // 55-70
  if (validElevation <= 2000) return 70 + ((validElevation - 1000) / 75); // 70-85
  if (validElevation <= 3000) return 85 + ((validElevation - 2000) / 200); // 85-95
  
  return Math.min(100, 95 + ((validElevation - 3000) / 500));            // 95-100
}
