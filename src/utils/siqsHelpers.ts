/**
 * Helper functions for safely working with SIQS values that might be numbers or objects
 */

import { SharedAstroSpot } from '@/lib/api/astroSpots';

/**
 * Get numeric SIQS score from any SIQS format (number or object)
 * @param siqs SIQS value which could be a number or object
 * @returns number value of SIQS or 0 if undefined
 */
export function getSiqsScore(siqs?: number | { score: number; isViable: boolean } | any): number {
  if (siqs === undefined || siqs === null) {
    return 0;
  }
  
  if (typeof siqs === 'number') {
    return siqs;
  }
  
  if (typeof siqs === 'object' && siqs !== null) {
    // Handle object format with score property
    if ('score' in siqs && typeof siqs.score === 'number') {
      return siqs.score;
    }
    
    // Handle possible siqsResult nested format
    if ('siqsResult' in siqs && siqs.siqsResult && typeof siqs.siqsResult.score === 'number') {
      return siqs.siqsResult.score;
    }
  }
  
  return 0;
}

/**
 * Check if SIQS is greater than a threshold
 * @param siqs SIQS value which could be a number or object
 * @param threshold Threshold to compare against
 * @returns boolean indicating if SIQS exceeds threshold
 */
export function isSiqsGreaterThan(siqs: number | { score: number; isViable: boolean } | undefined, threshold: number): boolean {
  const score = getSiqsScore(siqs);
  return score > threshold;
}

/**
 * Check if SIQS is greater than or equal to a threshold
 * @param siqs SIQS value which could be a number or object
 * @param threshold Threshold to compare against
 * @returns boolean indicating if SIQS meets or exceeds threshold
 */
export function isSiqsAtLeast(siqs: number | { score: number; isViable: boolean } | undefined, threshold: number): boolean {
  const score = getSiqsScore(siqs);
  return score >= threshold;
}

/**
 * Format SIQS for display, handling both number and object formats
 * @param siqs SIQS value which could be a number or object
 * @returns Formatted string representation of the SIQS score
 */
export function formatSiqsScore(siqs: number | { score: number; isViable: boolean } | undefined): string {
  const score = getSiqsScore(siqs);
  return score.toFixed(1);
}

/**
 * Get the display name for a location, preferring the language-specific name if available
 * @param location Location object
 * @param language Current language
 * @returns Display name string
 */
export function getLocationDisplayName(
  location: SharedAstroSpot, 
  language: 'en' | 'zh' = 'en'
): string {
  if (language === 'zh' && location.chineseName) {
    return location.chineseName;
  }
  return location.name || 'Unnamed Location';
}
