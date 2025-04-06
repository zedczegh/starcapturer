
/**
 * Utility functions for SIQS factor score calculations
 */

/**
 * Normalize a score to a standard 0-10 scale
 * @param score Raw score value
 * @param min Minimum possible score
 * @param max Maximum possible score
 * @param invert Whether to invert the scale (lower input = higher score)
 * @returns Normalized score on 0-10 scale
 */
export function normalizeScore(
  score: number, 
  min: number, 
  max: number, 
  invert: boolean = false
): number {
  // Ensure score is within bounds
  const boundedScore = Math.max(min, Math.min(max, score));
  
  // Calculate normalized value on 0-10 scale
  const normalized = ((boundedScore - min) / (max - min)) * 10;
  
  // Return inverted or normal score
  return invert ? 10 - normalized : normalized;
}

/**
 * Apply weighting to a score based on its importance
 * @param score Raw score
 * @param weight Weight factor (1 is standard)
 * @returns Weighted score
 */
export function applyWeight(score: number, weight: number = 1): number {
  return score * weight;
}

/**
 * Apply a logarithmic transformation for non-linear scoring
 * @param value Raw value
 * @param base Logarithm base
 * @returns Transformed value
 */
export function logTransform(value: number, base: number = 10): number {
  if (value <= 0) return 0;
  return Math.log(value) / Math.log(base);
}

/**
 * Calculate score using a sigmoid function for smoother transitions
 * @param value Input value
 * @param midpoint Value at which the result should be 0.5
 * @param steepness Controls the steepness of the transition (higher = steeper)
 * @returns Score between 0 and 1
 */
export function sigmoid(value: number, midpoint: number, steepness: number = 1): number {
  return 1 / (1 + Math.exp(-steepness * (value - midpoint)));
}
