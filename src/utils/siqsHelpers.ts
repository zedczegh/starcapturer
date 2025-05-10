
/**
 * SIQS score utilities
 */

// Get a numeric SIQS score from potentially complex SIQS data
export function getSiqsScore(siqs: number | { score: number; isViable?: boolean } | null | undefined): number {
  if (siqs === null || siqs === undefined) return 0;
  
  // Handle object format with score property
  if (typeof siqs === 'object' && 'score' in siqs) {
    return siqs.score;
  }
  
  // Handle numeric SIQS directly
  if (typeof siqs === 'number') {
    return siqs;
  }
  
  return 0;
}

/**
 * Format a SIQS score for display
 * @param siqs SIQS score
 * @returns Formatted score string
 */
export function formatSiqsForDisplay(siqs: number | null): string {
  if (siqs === null || siqs <= 0) return "N/A";
  return siqs.toFixed(1);
}

/**
 * Backwards compatibility: Alias for formatSiqsForDisplay
 */
export function formatSiqsScore(siqs: number | null): string {
  return formatSiqsForDisplay(siqs);
}

/**
 * Formats an array of SIQS factors for display
 * @param factors SIQS factors
 * @returns Formatted factors
 */
export function formatSiqsFactors(factors: Array<{name: string; score: number}> | undefined): string {
  if (!factors || factors.length === 0) return "";
  return factors.map(f => `${f.name}: ${f.score.toFixed(1)}`).join(", ");
}

/**
 * Check if SIQS is greater than a threshold
 */
export function isSiqsGreaterThan(siqs: number | { score: number } | null | undefined, threshold: number): boolean {
  const score = getSiqsScore(siqs);
  return score > threshold;
}

/**
 * Check if SIQS is at least a threshold value
 */
export function isSiqsAtLeast(siqs: number | { score: number } | null | undefined, threshold: number): boolean {
  const score = getSiqsScore(siqs);
  return score >= threshold;
}

/**
 * Normalize SIQS to a standard scale
 */
export function normalizeToSiqsScale(value: number, min = 0, max = 10): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

export function getSiqsColorClass(siqs: number | null): string {
  if (!siqs || siqs <= 0) return 'text-muted-foreground';
  if (siqs >= 8) return 'text-green-500';
  if (siqs >= 6.5) return 'text-lime-500';
  if (siqs >= 5) return 'text-yellow-500';
  if (siqs >= 3.5) return 'text-orange-500';
  return 'text-red-500';
}

// Standardize SIQS number handling with more sophisticated processing
export function processRawSiqsValue(rawValue: number | { score: number } | null | undefined): number {
  // Get the raw score first
  const score = getSiqsScore(rawValue);
  
  // Apply standard normalization and rounding
  if (score <= 0) return 0;
  
  // Ensure score is within proper range
  return Math.round(Math.min(Math.max(score, 0), 10) * 10) / 10;
}

/**
 * Compare two locations by SIQS score for sorting
 * @param a First location
 * @param b Second location
 * @returns Sort comparison result
 */
export function compareBySiqsScore(a: any, b: any): number {
  return (getSiqsScore(b.siqs) || 0) - (getSiqsScore(a.siqs) || 0);
}

/**
 * Sort locations by SIQS score (highest first)
 * @param locations Array of locations to sort
 * @returns Sorted array of locations
 */
export function sortLocationsBySiqs(locations: any[]): any[] {
  return [...locations].sort(compareBySiqsScore);
}
