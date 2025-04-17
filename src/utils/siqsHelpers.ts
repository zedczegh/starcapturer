
/**
 * Utility functions for working with SIQS scores
 */

/**
 * Get a SIQS score safely from different possible score formats
 * @param siqs The SIQS value in any supported format
 * @returns A normalized SIQS score as a number
 */
export function getSiqsScore(siqs: any): number {
  if (typeof siqs === 'number') {
    return siqs;
  }
  
  if (siqs && typeof siqs === 'object') {
    if (typeof siqs.score === 'number') {
      return siqs.score;
    }
    if (typeof siqs.siqs === 'number') {
      return siqs.siqs;
    }
  }
  
  return 0;
}

/**
 * Check if a SIQS score meets or exceeds a threshold
 * @param siqs The SIQS value in any supported format
 * @param threshold The minimum acceptable value
 * @returns True if the SIQS meets or exceeds the threshold
 */
export function isSiqsAtLeast(siqs: any, threshold: number): boolean {
  return getSiqsScore(siqs) >= threshold;
}

/**
 * Check if a SIQS score is greater than a threshold 
 * @param siqs The SIQS value in any supported format
 * @param threshold The threshold value
 * @returns True if the SIQS exceeds the threshold
 */
export function isSiqsGreaterThan(siqs: any, threshold: number): boolean {
  return getSiqsScore(siqs) > threshold;
}

/**
 * Format a SIQS score for display
 * @param siqs The SIQS value in any supported format
 * @param precision Number of decimal places (default: 1)
 * @returns Formatted SIQS score string
 */
export function formatSiqsScore(siqs: any, precision: number = 1): string {
  const score = getSiqsScore(siqs);
  return score.toFixed(precision);
}

/**
 * Get a color representing the SIQS quality level
 * @param siqs The SIQS value in any supported format
 * @returns CSS color string
 */
export function getSiqsColor(siqs: any): string {
  const score = getSiqsScore(siqs);
  
  if (score >= 8.0) return 'bg-green-500';
  if (score >= 6.5) return 'bg-lime-500';
  if (score >= 5.0) return 'bg-yellow-500';
  if (score >= 3.5) return 'bg-orange-500';
  return 'bg-red-500';
}

/**
 * Get a text description of the SIQS quality
 * @param siqs The SIQS value in any supported format
 * @returns Text description
 */
export function getSiqsQualityDescription(siqs: any): string {
  const score = getSiqsScore(siqs);
  
  if (score >= 8.0) return 'Excellent';
  if (score >= 6.5) return 'Good';
  if (score >= 5.0) return 'Fair';
  if (score >= 3.5) return 'Poor';
  return 'Very Poor';
}
