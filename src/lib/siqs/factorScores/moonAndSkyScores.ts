
/**
 * Moon phase and clear sky rate score calculations for SIQS
 */

/**
 * Calculate score based on moon phase
 * @param moonPhase Moon phase (0-1, where 0=new moon, 1=full moon)
 * @returns Score on 0-10 scale
 */
export function calculateMoonScore(moonPhase: number): number {
  // Validate input
  const validMoonPhase = Math.max(0, Math.min(1, moonPhase));
  
  // Moon phase inversely correlates with score (lower phase = better conditions)
  // Enhanced non-linear scoring to reflect actual impact on observation
  // 0 (new moon) = 10, 0.25 (crescent) = 8, 0.5 (quarter) = 6, 0.75 (gibbous) = 4, 1 (full) = 2
  
  // Using a quadratic curve for smoother transition
  return 10 - 8 * (validMoonPhase * validMoonPhase);
}

/**
 * Calculate score based on clear sky rate
 * @param clearSkyRate Annual clear sky rate percentage (0-100)
 * @returns Score on 0-10 scale
 */
export function calculateClearSkyScore(clearSkyRate: number | undefined): number {
  // If no data available, return neutral score
  if (clearSkyRate === undefined || clearSkyRate === null) {
    return 5;
  }
  
  // Validate input
  const validRate = Math.max(0, Math.min(100, clearSkyRate));
  
  // Clear sky rate directly correlates with score (higher rate = better score)
  // 0% = 0, 25% = 2.5, 50% = 5, 75% = 7.5, 100% = 10
  return validRate / 10;
}

/**
 * Calculate score based on terrain elevation
 * @param elevation Elevation in meters
 * @returns Score on 0-10 scale
 */
export function calculateElevationScore(elevation: number | undefined): number {
  // If no data available, return neutral score
  if (elevation === undefined || elevation === null) {
    return 5;
  }
  
  // Validate input
  const validElevation = Math.max(0, elevation);
  
  // Elevation scoring: higher elevation = better score, with diminishing returns
  // 0m = 5, 500m = 6, 1000m = 7, 2000m = 8.5, 3000m+ = 10
  
  if (validElevation < 500) {
    return 5 + (validElevation * (1 / 500));
  } else if (validElevation < 1000) {
    return 6 + ((validElevation - 500) * (1 / 500));
  } else if (validElevation < 2000) {
    return 7 + ((validElevation - 1000) * (1.5 / 1000));
  } else if (validElevation < 3000) {
    return 8.5 + ((validElevation - 2000) * (1.5 / 1000));
  } else {
    return 10;
  }
}
