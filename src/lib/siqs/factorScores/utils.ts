
/**
 * Common utility functions for SIQS factor calculations
 */

/**
 * Normalize score to ensure it's within 0-10 range
 * @param score Raw score value
 * @returns Normalized score in 0-10 range
 */
export function normalizeScore(score: number): number {
  return Math.max(0, Math.min(10, score));
}

/**
 * Apply weight to a score
 * @param score Raw score (0-10)
 * @param weight Weight factor
 * @returns Weighted score
 */
export function applyWeight(score: number, weight: number): number {
  return normalizeScore(score) * weight;
}

/**
 * Convert a raw value to a score using a custom mapping function
 * @param value Raw value to convert
 * @param mapper Mapping function that converts the value to a 0-10 score
 * @returns Normalized score in 0-10 range
 */
export function mapToScore(
  value: number, 
  mapper: (val: number) => number
): number {
  return normalizeScore(mapper(value));
}

/**
 * Create linear score mapping between input and output ranges
 * @param value Input value
 * @param inMin Minimum input value
 * @param inMax Maximum input value
 * @param outMin Minimum output score (default: 0)
 * @param outMax Maximum output score (default: 10)
 * @param inverse Invert the mapping (default: false)
 * @returns Mapped score
 */
export function linearMap(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number = 0,
  outMax: number = 10,
  inverse: boolean = false
): number {
  // Clamp input value to range
  const clampedValue = Math.max(inMin, Math.min(inMax, value));
  
  // Calculate the proportion of the value in its input range
  let proportion = (clampedValue - inMin) / (inMax - inMin);
  
  // Invert if requested (higher input = lower output)
  if (inverse) {
    proportion = 1 - proportion;
  }
  
  // Map to the output range
  return outMin + proportion * (outMax - outMin);
}

/**
 * Create a threshold-based score mapping
 * @param value Raw value to map
 * @param thresholds Array of thresholds with corresponding scores
 * @param smoothTransition Whether to interpolate between thresholds (default: true)
 * @returns Mapped score
 */
export function thresholdMap(
  value: number,
  thresholds: Array<[number, number]>, // [threshold, score] pairs
  smoothTransition: boolean = true
): number {
  // Sort thresholds ascending by threshold value
  const sortedThresholds = [...thresholds].sort((a, b) => a[0] - b[0]);
  
  // If value is below first threshold, return first score
  if (value <= sortedThresholds[0][0]) {
    return sortedThresholds[0][1];
  }
  
  // If value is above last threshold, return last score
  if (value >= sortedThresholds[sortedThresholds.length - 1][0]) {
    return sortedThresholds[sortedThresholds.length - 1][1];
  }
  
  // Find the two thresholds the value falls between
  for (let i = 0; i < sortedThresholds.length - 1; i++) {
    const [lowerThreshold, lowerScore] = sortedThresholds[i];
    const [upperThreshold, upperScore] = sortedThresholds[i + 1];
    
    if (value >= lowerThreshold && value < upperThreshold) {
      if (smoothTransition) {
        // Interpolate between scores
        const proportion = (value - lowerThreshold) / (upperThreshold - lowerThreshold);
        return lowerScore + proportion * (upperScore - lowerScore);
      } else {
        // Use lower threshold score (no interpolation)
        return lowerScore;
      }
    }
  }
  
  // Fallback (should never reach here)
  return 5;
}
