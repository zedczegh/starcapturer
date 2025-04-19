/**
 * Helper functions for safely working with SIQS values that might be numbers or objects
 */

import { SharedAstroSpot } from '@/lib/api/astroSpots';

/**
 * Get numeric SIQS score from any SIQS format (number or object)
 * Auto-converts 0-100 scale to 0-10 scale
 * @param siqs SIQS value which could be a number or object
 * @returns number value of SIQS or 0 if undefined
 */
export function getSiqsScore(siqs?: number | string | { score: number; isViable: boolean } | any): number {
  if (siqs === undefined || siqs === null) {
    return 0;
  }
  
  let score = 0;
  
  // Handle string values (parsing to number)
  if (typeof siqs === 'string') {
    score = parseFloat(siqs);
  }
  // Handle numeric values directly
  else if (typeof siqs === 'number') {
    score = siqs;
  }
  // Handle SharedAstroSpot object with siqs property
  else if (typeof siqs === 'object' && siqs !== null) {
    // Case: location.siqs passed directly as an object with score property
    if ('siqs' in siqs && typeof siqs.siqs !== 'undefined') {
      score = getSiqsScore(siqs.siqs);
    }
    // Case: { score: number } object
    else if ('score' in siqs && typeof siqs.score === 'number') {
      score = siqs.score;
    }
  }
  
  // Convert 0-100 scale to 0-10 scale if needed
  if (score > 10) {
    score = score / 10;
  }
  
  // Ensure score is in valid range
  return Math.max(0, Math.min(10, score));
}

/**
 * Check if SIQS score is at least a certain value
 */
export function isSiqsAtLeast(siqs: any, minValue: number): boolean {
  const score = getSiqsScore(siqs);
  return score >= minValue;
}

/**
 * Check if SIQS score is greater than a value
 */
export function isSiqsGreaterThan(siqs: any, threshold: number): boolean {
  const score = getSiqsScore(siqs);
  return score > threshold;
}

/**
 * Check if SIQS score is valid (greater than 0)
 */
export function isValidSiqs(siqs: any): boolean {
  const score = getSiqsScore(siqs);
  return score > 0;
}

/**
 * Get SIQS score from a location object
 */
export function getLocationSiqs(location: SharedAstroSpot | any): number {
  if (!location) return 0;
  
  // Use direct SIQS property if available
  if ('siqs' in location) {
    return getSiqsScore(location.siqs);
  }
  
  // Try to get from siqsResult if available
  if ('siqsResult' in location && location.siqsResult) {
    return getSiqsScore(location.siqsResult);
  }
  
  return 0;
}

/**
 * Format SIQS score for display (always 1-10 scale)
 */
export function formatSiqsScore(siqs: number | any): string {
  const score = typeof siqs === 'number' ? siqs : getSiqsScore(siqs);
  if (score <= 0) return 'N/A';
  return score.toFixed(1);
}

/**
 * Format SIQS for display with consistent 1-10 scale
 */
export function formatSiqsForDisplay(score: number | null): string {
  if (score === null || score <= 0) return 'N/A';
  
  // Convert 0-100 scale to 0-10 if needed
  const normalizedScore = score > 10 ? score / 10 : score;
  return normalizedScore.toFixed(1);
}
