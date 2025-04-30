
/**
 * Safely extracts a numeric SIQS score from either a number or an object with a score property
 * 
 * @param siqs The SIQS value that could be a number or an object
 * @returns A number representing the SIQS score, or null if no valid score exists
 */
export function getSiqsScore(siqs: number | { score: number; isViable: boolean; } | undefined): number | null {
  if (siqs === undefined || siqs === null) {
    return null;
  }
  
  if (typeof siqs === 'number') {
    return siqs;
  }
  
  if (typeof siqs === 'object' && siqs !== null && 'score' in siqs) {
    return siqs.score;
  }
  
  return null;
}

/**
 * Checks if a SIQS score is greater than a given threshold
 * 
 * @param siqs The SIQS value that could be a number or an object
 * @param threshold The threshold value to compare against
 * @returns True if the SIQS score is greater than the threshold, false otherwise
 */
export function isSiqsGreaterThan(
  siqs: number | { score: number; isViable: boolean; } | undefined, 
  threshold: number
): boolean {
  const score = getSiqsScore(siqs);
  return score !== null && score > threshold;
}

/**
 * Checks if a SIQS score is at least a given threshold
 * 
 * @param siqs The SIQS value that could be a number or an object
 * @param threshold The threshold value to compare against
 * @returns True if the SIQS score is at least the threshold, false otherwise
 */
export function isSiqsAtLeast(
  siqs: number | { score: number; isViable: boolean; } | undefined, 
  threshold: number
): boolean {
  const score = getSiqsScore(siqs);
  return score !== null && score >= threshold;
}

/**
 * Normalizes a SIQS score to ensure it's on the standard 1-10 scale
 * 
 * @param siqs The SIQS score to normalize
 * @returns A normalized SIQS score on the 1-10 scale
 */
export function normalizeToSiqsScale(siqs: number): number {
  if (siqs <= 0) return 0;
  
  // If already in 0-10 range, return as is
  if (siqs <= 10) return siqs;
  
  // If in 0-100 range, normalize to 0-10
  if (siqs <= 100) return siqs / 10;
  
  // For other ranges, use a logarithmic scale
  return Math.min(10, Math.log10(siqs) * 3);
}

/**
 * Format SIQS score for display with appropriate decimal places
 * 
 * @param score The SIQS score to format
 * @returns A formatted string representation of the SIQS score
 */
export function formatSiqsForDisplay(score: number): string {
  if (score >= 10) {
    return "10"; // Cap at 10
  }
  
  if (Number.isInteger(score)) {
    return score.toString();
  }
  
  // Format with one decimal place
  return score.toFixed(1);
}

/**
 * Alias for formatSiqsForDisplay for backward compatibility
 */
export function formatSiqsScore(score: number): string {
  return formatSiqsForDisplay(score);
}
