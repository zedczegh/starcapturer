
/**
 * Utility functions for factor score calculations
 */

/**
 * Normalize a score to a standard 0-100 scale
 * @param score Raw score value
 * @param min Minimum possible score
 * @param max Maximum possible score
 * @param invert Whether to invert the scale (lower input = higher score)
 * @returns Normalized score on 0-100 scale
 */
export function normalizeScore(
  score: number, 
  min: number, 
  max: number, 
  invert: boolean = false
): number {
  // Ensure score is within bounds
  const boundedScore = Math.max(min, Math.min(max, score));
  
  // Calculate normalized value on 0-100 scale
  const normalized = ((boundedScore - min) / (max - min)) * 100;
  
  // Return inverted or normal score
  return invert ? 100 - normalized : normalized;
}
