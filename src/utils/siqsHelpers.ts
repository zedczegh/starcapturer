/**
 * Helper functions for safely working with SIQS values that might be numbers or objects
 */

import { SharedAstroSpot } from '@/lib/api/astroSpots';

/**
 * Safely extracts a numeric SIQS score from various possible input formats
 */
export function getSiqsScore(input: any): number {
  if (input === null || input === undefined) return 0;
  
  // Handle simple number case
  if (typeof input === 'number') return input;
  
  // Handle object with score property
  if (typeof input === 'object') {
    if ('score' in input && typeof input.score === 'number') return input.score;
    if ('siqs' in input && typeof input.siqs === 'number') return input.siqs;
  }
  
  // Handle string that might be parsable as a number
  if (typeof input === 'string' && !isNaN(Number(input))) {
    return Number(input);
  }
  
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

/**
 * Compare if a SIQS value is at least a certain threshold
 * @param siqs SIQS value which could be a number or object
 * @param threshold Minimum threshold to compare against
 * @returns true if the SIQS is at least the threshold
 */
export function isSiqsAtLeast(siqs: number | any, threshold: number): boolean {
  const score = getSiqsScore(siqs);
  return score >= threshold;
}

/**
 * Compare if a SIQS value is greater than a certain threshold
 * @param siqs SIQS value which could be a number or object
 * @param threshold Threshold to compare against
 * @returns true if the SIQS is greater than the threshold
 */
export function isSiqsGreaterThan(siqs: number | any, threshold: number): boolean {
  const score = getSiqsScore(siqs);
  return score > threshold;
}

/**
 * Sort locations by SIQS score (highest first)
 * @param locations Array of locations to sort
 * @returns Sorted array of locations
 */
export function sortLocationsBySiqs(locations: SharedAstroSpot[]): SharedAstroSpot[] {
  return [...locations].sort((a, b) => {
    const aRealTime = (a as any).realTimeSiqs;
    const bRealTime = (b as any).realTimeSiqs;
    
    const aSiqs = typeof aRealTime === "number" && aRealTime > 0
      ? aRealTime
      : getSiqsScore(a.siqs);
      
    const bSiqs = typeof bRealTime === "number" && bRealTime > 0
      ? bRealTime
      : getSiqsScore(b.siqs);
      
    return (bSiqs || 0) - (aSiqs || 0);
  });
}
