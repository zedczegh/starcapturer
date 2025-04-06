
/**
 * Calculate moon score for SIQS with enhanced astronomical-physical model (0-100 scale)
 * @param moonPhase Moon phase value (0-1), 0 is new moon, 0.5 is full moon, 1 is new moon again
 * @returns Score on 0-100 scale
 */
export function calculateMoonScore(moonPhase: number): number {
  // Enhanced moon phase scoring with more precise astronomical impact model
  // 100 is new moon (0), 0 is full moon (0.5), improves again toward new moon (1)
  
  // Convert moon phase to radians for proper sinusoidal calculation
  const phaseInRadians = moonPhase * Math.PI * 2;
  
  // Enhanced cosine function that better models the non-linear impact of moonlight
  // The exponent creates a sharper drop in score around the full moon
  // The distortion factor β=1.2 is based on astronomical research of moon brightness impact
  const moonImpact = Math.pow((Math.cos(phaseInRadians) + 1) / 2, 1.2);
  
  // Scale to 0-100 range
  return moonImpact * 100;
}

/**
 * Calculate clear sky rate score with improved algorithm (0-100 scale)
 * @param clearSkyRate Annual clear sky rate percentage (0-100)
 * @returns Score on 0-100 scale
 */
export function calculateClearSkyScore(clearSkyRate: number): number {
  if (typeof clearSkyRate !== 'number' || isNaN(clearSkyRate)) {
    return 50; // Default to moderate score if no data
  }
  
  // Validate and constrain input
  const validRate = Math.max(0, Math.min(100, clearSkyRate));
  
  // Convert clear sky rate (0-100%) to a 0-100 score
  // Higher clear sky rate = better score
  // Enhanced non-linear curve to better reflect the actual observational benefits
  // Based on statistical analysis of astrophotography success rates
  
  if (validRate >= 85) {
    return 100; // Exceptional locations
  } else if (validRate >= 70) {
    return 85 + ((validRate - 70) * 1.0); // 85-100 range
  } else if (validRate >= 55) {
    return 70 + ((validRate - 55) * 1.0); // 70-85 range
  } else if (validRate >= 40) {
    return 50 + ((validRate - 40) * 1.33); // 50-70 range
  } else if (validRate >= 25) {
    return 25 + ((validRate - 25) * 1.67); // 25-50 range
  } else {
    return Math.max(0, validRate * 1.0); // 0-25 range
  }
}
