
/**
 * Helper functions for safely working with SIQS values that might be numbers or objects
 */

import { SharedAstroSpot } from '@/lib/api/astroSpots';

/**
 * Get numeric SIQS score from any SIQS format (number or object)
 * @param siqs SIQS value which could be a number or object
 * @returns number value of SIQS or 0 if undefined
 */
export function getSiqsScore(siqs?: number | string | { score: number; isViable: boolean } | any): number {
  if (siqs === undefined || siqs === null) {
    return 0;
  }
  
  // Handle string values (parsing to number)
  if (typeof siqs === 'string') {
    const parsed = parseFloat(siqs);
    return isNaN(parsed) ? 0 : normalizeToSiqsScale(parsed);
  }
  
  // Handle numeric values directly
  if (typeof siqs === 'number') {
    return isNaN(siqs) ? 0 : normalizeToSiqsScale(siqs);
  }
  
  // Handle SharedAstroSpot object with siqs property
  if (typeof siqs === 'object' && siqs !== null) {
    // Case: location.siqs passed directly as an object with score property
    if ('siqs' in siqs && typeof siqs.siqs !== 'undefined') {
      return getSiqsScore(siqs.siqs);
    }
    
    // Case: { score: number } object
    if ('score' in siqs && typeof siqs.score === 'number') {
      return isNaN(siqs.score) ? 0 : normalizeToSiqsScale(siqs.score);
    }
  }
  
  // Default to 0 if no valid score found
  return 0;
}

/**
 * Normalize a score to ensure it's in the 0-10 range
 */
export function normalizeToSiqsScale(score: number): number {
  // Handle NaN
  if (isNaN(score)) return 0;
  
  // If score is already in 0-10 range, return as is
  if (score >= 0 && score <= 10) {
    return score;
  }
  
  // If score is on 0-100 scale, normalize to 0-10
  if (score > 10 && score <= 100) {
    return score / 10;
  }
  
  // Cap values outside of accepted ranges
  if (score > 100) return 10;
  if (score < 0) return 0;
  
  return score;
}

/**
 * Format SIQS score for display
 * @param score SIQS score
 * @returns Formatted string representation with one decimal place or "N/A"
 */
export function formatSiqsForDisplay(score: number | null): string {
  if (score === null || score <= 0) {
    return "N/A";
  }
  
  // Ensure score is normalized to 0-10 scale and format with one decimal place
  const normalizedScore = normalizeToSiqsScale(score);
  return normalizedScore.toFixed(1);
}

/**
 * Get formatted SIQS score from any SIQS format
 * @param siqs SIQS value which could be a number or object
 * @returns Formatted string representation
 */
export function formatSiqsScore(siqs?: number | { score: number; isViable: boolean } | any): string {
  const score = getSiqsScore(siqs);
  return formatSiqsForDisplay(score);
}
