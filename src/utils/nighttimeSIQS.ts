import { SharedAstroSpot } from '@/lib/siqs/types';

/**
 * Gets a consistent SIQS value from a location
 * Prioritizes the most accurate source of SIQS data
 * @param location Location object with potential SIQS data
 * @returns A consistent SIQS value (0-10)
 */
export function getConsistentSiqsValue(location: SharedAstroSpot): number {
  // Priority order:
  // 1. Use siqsResult.score if available (from full calculation)
  // 2. Use siqs property if available (simplified or cached value)
  // 3. Infer from Bortle scale if available
  // 4. Default to 0 (unknown)
  
  if (location.siqsResult && typeof location.siqsResult.score === 'number') {
    return location.siqsResult.score;
  }
  
  if (typeof location.siqs === 'number') {
    return location.siqs;
  }
  
  if (typeof location.bortleScale === 'number') {
    // Rough mapping from Bortle scale (1-9) to SIQS (0-10)
    // Note: Bortle scale is inverse (lower is better)
    return Math.max(0, Math.min(10, 10 - (location.bortleScale - 1)));
  }
  
  return 0; // Unknown SIQS
}

/**
 * Determines if a location has good enough viewing conditions
 * @param location Location to evaluate
 * @param minimumSiqs Minimum required SIQS score (default: 5)
 * @returns Boolean indicating if the location is viable
 */
export function isLocationViable(
  location: SharedAstroSpot,
  minimumSiqs: number = 5
): boolean {
  // If isViable is already set, use that
  if (typeof location.isViable === 'boolean') {
    return location.isViable;
  }
  
  // Otherwise calculate based on SIQS
  const siqs = getConsistentSiqsValue(location);
  return siqs >= minimumSiqs;
}

/**
 * Format a SIQS score for display
 * @param siqs SIQS score
 * @param precision Number of decimal places (default: 1)
 * @returns Formatted SIQS string
 */
export function formatSiqsForDisplay(
  siqs: number | undefined | null,
  precision: number = 1
): string {
  if (siqs === undefined || siqs === null) {
    return '—';
  }
  
  return siqs.toFixed(precision);
}
