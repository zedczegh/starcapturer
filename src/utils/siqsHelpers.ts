
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
