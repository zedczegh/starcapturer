
/**
 * Helper functions for SIQS (Sky Imaging Quality Score) data handling
 */

/**
 * Gets a normalized SIQS score from various possible data formats
 * @param siqs The SIQS data in various formats (number, object with score property, etc.)
 * @returns The normalized SIQS score on a scale of 0-10
 */
export function getSiqsScore(siqs: any): number {
  if (siqs === null || siqs === undefined) {
    return 0;
  }
  
  if (typeof siqs === 'number') {
    return normalizeToSiqsScale(siqs);
  }
  
  if (typeof siqs === 'object') {
    if ('score' in siqs && typeof siqs.score === 'number') {
      return normalizeToSiqsScale(siqs.score);
    }
    if ('siqs' in siqs && typeof siqs.siqs === 'number') {
      return normalizeToSiqsScale(siqs.siqs);
    }
  }
  
  return 0;
}

/**
 * Normalizes a SIQS score to ensure it's on a scale of 0-10
 * @param score The raw SIQS score
 * @returns The normalized score on a scale of 0-10
 */
export function normalizeToSiqsScale(score: number): number {
  if (score <= 0) {
    return 0;
  }
  
  // If score is already in the range of 0-10, return it as is
  if (score <= 10) {
    return score;
  }
  
  // If score is on a scale of 0-100, convert to 0-10
  if (score <= 100) {
    return score / 10;
  }
  
  // For any other larger scale, normalize to 0-10 range
  return 10;
}
