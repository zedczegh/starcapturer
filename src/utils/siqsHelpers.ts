
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
  // Debug log to diagnose type issues
  // console.log("SIQS input value:", siqs, "with type:", typeof siqs);
  
  if (siqs === undefined || siqs === null) {
    return 0;
  }
  
  // Handle string values (parsing to number)
  if (typeof siqs === 'string') {
    const parsed = parseFloat(siqs);
    return isNaN(parsed) ? 0 : parsed;
  }
  
  // Handle numeric values directly
  if (typeof siqs === 'number') {
    return isNaN(siqs) ? 0 : siqs;
  }
  
  // Handle SharedAstroSpot object with siqs property
  if (typeof siqs === 'object' && siqs !== null) {
    // Case: location.siqs passed directly as an object with score property
    if ('siqs' in siqs && typeof siqs.siqs !== 'undefined') {
      return getSiqsScore(siqs.siqs);
    }
    
    // Case: { score: number } object
    if ('score' in siqs && typeof siqs.score === 'number') {
      return isNaN(siqs.score) ? 0 : siqs.score;
    }
  }
  
  // Default fallback
  return 0;
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
  const score = typeof siqs === 'number' ? siqs : getSiqsScore(siqs);
  if (score <= 0) return 'N/A';
  return score.toFixed(1);
}

/**
 * Get appropriate SIQS display format
 */
export function formatSiqsForDisplay(score: number | null): string {
  if (score === null || score <= 0) return 'N/A';
  return score.toFixed(1);
}
