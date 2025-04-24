
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
  
  // Default fallback
  return 0;
}

/**
 * Normalize scores to ensure they're on the 1-10 scale
 * @param score The score to normalize
 * @returns Normalized score in the 1-10 range
 */
export function normalizeToSiqsScale(score: number): number {
  // If score is already in 0-10 range, return it
  if (score >= 0 && score <= 10) {
    return score;
  }
  
  // If score is on a 0-100 scale, convert to 0-10
  if (score > 10 && score <= 100) {
    return score / 10;
  }
  
  // For any other range, clamp to 0-10
  return Math.min(10, Math.max(0, score));
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
 * Format SIQS score for display
 */
export function formatSiqsScore(siqs: number | any): string {
  const score = typeof siqs === 'number' ? normalizeToSiqsScale(siqs) : getSiqsScore(siqs);
  if (score <= 0) return 'N/A';
  return score.toFixed(1);
}

/**
 * Get appropriate SIQS display format
 */
export function formatSiqsForDisplay(score: number | null): string {
  if (score === null || score <= 0) return 'N/A';
  // Normalize score to 1-10 scale if needed
  const normalizedScore = normalizeToSiqsScale(score);
  return normalizedScore.toFixed(1);
}

