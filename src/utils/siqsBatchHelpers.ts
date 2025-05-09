
/**
 * Batch helpers for safely modifying files that have SIQS comparison/arithmetic issues
 * This utility is designed to be imported in multiple places to standardize SIQS handling
 */

import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { getSiqsScore, isSiqsGreaterThan, isSiqsAtLeast, SiqsValue } from './siqsHelpers';

/**
 * Apply standard SIQS filters to a list of locations
 * @param locations Array of locations to filter
 * @param minScore Minimum SIQS score to include
 * @returns Filtered array of locations
 */
export function filterLocationsBySiqsScore(
  locations: SharedAstroSpot[],
  minScore: number = 0
): SharedAstroSpot[] {
  return locations.filter(loc => {
    // Skip undefined SIQS values
    if (loc.siqs === undefined) return false;
    
    // Use the helper to safely compare
    return isSiqsGreaterThan(loc.siqs, minScore);
  });
}

/**
 * Compare two locations by SIQS score for sorting
 * @param a First location
 * @param b Second location
 * @returns Sort comparison result
 */
export function compareBySiqsScore(a: SharedAstroSpot, b: SharedAstroSpot): number {
  return (getSiqsScore(b.siqs) || 0) - (getSiqsScore(a.siqs) || 0);
}

/**
 * Sort locations by SIQS score (highest first)
 * @param locations Array of locations to sort
 * @returns Sorted array of locations
 */
export function sortLocationsBySiqsScore(
  locations: SharedAstroSpot[]
): SharedAstroSpot[] {
  return [...locations].sort(compareBySiqsScore);
}
