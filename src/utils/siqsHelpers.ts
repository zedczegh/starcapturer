
/**
 * Utilities for handling SIQS (Sky Imaging Quality Score) related calculations and formatting
 */

/**
 * Normalize SIQS score to standard 0-10 scale
 * @param score Raw SIQS score
 * @returns Score normalized to 0-10 range
 */
export function normalizeToSiqsScale(score: number): number {
  if (score <= 0) return 0;
  if (score > 100) return 10;
  if (score > 10) return score / 10;
  return score;
}

/**
 * Format SIQS score for display with consistent decimal places
 * @param siqs SIQS score
 * @param decimalPlaces Number of decimal places to show
 * @returns Formatted SIQS string
 */
export function formatSiqsForDisplay(siqs: number | null | undefined, decimalPlaces: number = 1): string {
  if (siqs === null || siqs === undefined) return '—';
  
  const normalizedScore = normalizeToSiqsScale(siqs);
  return normalizedScore.toFixed(decimalPlaces);
}

/**
 * Check if SIQS score is at least a certain value
 * @param siqs SIQS score to check
 * @param threshold Minimum required value
 * @returns Boolean indicating if SIQS meets threshold
 */
export function isSiqsAtLeast(siqs: number | null | undefined, threshold: number): boolean {
  if (siqs === null || siqs === undefined) return false;
  return normalizeToSiqsScale(siqs) >= threshold;
}

/**
 * Check if SIQS score is greater than a certain value
 * @param siqs SIQS score to check
 * @param threshold Value to compare against
 * @returns Boolean indicating if SIQS exceeds threshold
 */
export function isSiqsGreaterThan(siqs: number | null | undefined, threshold: number): boolean {
  if (siqs === null || siqs === undefined) return false;
  return normalizeToSiqsScale(siqs) > threshold;
}

/**
 * Sort an array of locations by their SIQS score
 * @param locations Array of location objects with siqs property
 * @param descending Sort in descending order (highest first) if true
 * @returns Sorted array of locations
 */
export function sortLocationsBySiqs<T extends { siqs?: number | null }>(
  locations: T[],
  descending: boolean = true
): T[] {
  return [...locations].sort((a, b) => {
    const siqsA = a.siqs !== undefined && a.siqs !== null ? normalizeToSiqsScale(a.siqs) : -1;
    const siqsB = b.siqs !== undefined && b.siqs !== null ? normalizeToSiqsScale(b.siqs) : -1;
    
    return descending ? siqsB - siqsA : siqsA - siqsB;
  });
}

/**
 * Get display color class based on SIQS score
 * @param siqs SIQS score
 * @returns CSS color class name
 */
export function getSiqsColorClass(siqs: number | null | undefined): string {
  if (siqs === null || siqs === undefined) return 'text-gray-400';
  
  const normalizedScore = normalizeToSiqsScale(siqs);
  
  if (normalizedScore >= 8) return 'text-green-500';
  if (normalizedScore >= 6) return 'text-blue-500';
  if (normalizedScore >= 5) return 'text-yellow-500';
  if (normalizedScore >= 4) return 'text-orange-500';
  return 'text-red-500';
}
