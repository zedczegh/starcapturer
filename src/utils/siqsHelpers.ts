
/**
 * Helper functions for working with SIQS (Sky Quality Score) data
 */

/**
 * Extract a numeric SIQS score from various data formats
 * @param siqs - SIQS data in various possible formats
 * @returns Numeric SIQS score or null if not available
 */
export function getSiqsScore(siqs: any): number | null {
  // If it's already a number, return it directly
  if (typeof siqs === 'number') {
    return siqs;
  }
  
  // If null or undefined, return null
  if (siqs === null || siqs === undefined) {
    return null;
  }
  
  // If it's an object with a score property
  if (typeof siqs === 'object' && 'score' in siqs) {
    return typeof siqs.score === 'number' ? siqs.score : null;
  }
  
  // Try to parse it as a number if it's a string
  if (typeof siqs === 'string') {
    const parsed = parseFloat(siqs);
    return isNaN(parsed) ? null : parsed;
  }
  
  // If we can't determine the SIQS score, return null
  return null;
}

/**
 * Format a SIQS score for display
 * @param siqs - SIQS score number or object
 * @returns Formatted string or "--" if not available
 */
export function formatSiqsForDisplay(siqs: any): string {
  const score = getSiqsScore(siqs);
  if (score === null) {
    return "--";
  }
  return score.toFixed(1);
}

/**
 * Check if a location has valid SIQS data
 * @param location - Location data object
 * @returns Boolean indicating if valid SIQS data exists
 */
export function hasValidSiqs(location: any): boolean {
  return getSiqsScore(location?.siqs) !== null;
}

/**
 * Compare two locations based on SIQS scores
 * @param a - First location
 * @param b - Second location
 * @returns Comparison result (-1, 0, 1)
 */
export function compareBySiqs(a: any, b: any): number {
  const scoreA = getSiqsScore(a?.siqs) || 0;
  const scoreB = getSiqsScore(b?.siqs) || 0;
  return scoreB - scoreA; // Higher scores first
}

/**
 * Get SIQS quality level based on score
 * @param score - SIQS score
 * @returns Quality level string
 */
export function getSiqsQuality(score: number | null): string {
  if (score === null) return "Unknown";
  if (score >= 8.5) return "Excellent";
  if (score >= 7.0) return "Very Good";
  if (score >= 5.5) return "Good";
  if (score >= 4.0) return "Average";
  if (score >= 2.5) return "Poor";
  return "Very Poor";
}
