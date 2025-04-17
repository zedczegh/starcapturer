
/**
 * Helper functions for working with SIQS scores
 */

/**
 * Get numerical SIQS score from various formats
 * @param siqs SIQS value (can be number, object or undefined)
 * @returns Numerical SIQS score or 0 if not available
 */
export function getSiqsScore(siqs: any): number {
  if (siqs === null || siqs === undefined) {
    return 0;
  }
  
  if (typeof siqs === 'number') {
    return siqs;
  }
  
  if (typeof siqs === 'object') {
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
 * Check if SIQS score is greater than a threshold
 * @param siqs SIQS value (can be number, object or undefined)
 * @param threshold Threshold to compare against
 * @returns True if SIQS is greater than threshold
 */
export function isSiqsGreaterThan(siqs: any, threshold: number): boolean {
  const score = getSiqsScore(siqs);
  return score > threshold;
}

/**
 * Format SIQS score for display
 * @param siqs SIQS value
 * @param decimalPlaces Number of decimal places (default: 1)
 * @returns Formatted string
 */
export function formatSiqsScore(siqs: any, decimalPlaces: number = 1): string {
  const score = getSiqsScore(siqs);
  return score.toFixed(decimalPlaces);
}

/**
 * Get descriptive text for SIQS score
 * @param siqs SIQS value
 * @returns Description of quality
 */
export function getSiqsDescription(siqs: any): string {
  const score = getSiqsScore(siqs);
  
  if (score >= 8.5) return "Excellent";
  if (score >= 7.0) return "Very Good";
  if (score >= 5.5) return "Good";
  if (score >= 4.0) return "Fair";
  if (score >= 2.5) return "Poor";
  return "Very Poor";
}
