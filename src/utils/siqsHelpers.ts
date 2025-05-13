
/**
 * SIQS (Sky Imaging Quality Score) Helper Functions
 */

/**
 * Gets a normalized SIQS score from various possible data formats
 * @param siqs The SIQS data in various formats (number, object with score property, etc.)
 * @returns The normalized SIQS score on a scale of 0-10
 */
export function getSiqsScore(siqs: any): number {
  if (siqs === null || siqs === undefined) {
    return 0;
  }
  
  if (typeof siqs === 'number') {
    return normalizeToSiqsScale(siqs);
  }
  
  if (typeof siqs === 'object') {
    if ('score' in siqs && typeof siqs.score === 'number') {
      return normalizeToSiqsScale(siqs.score);
    }
    if ('siqs' in siqs && typeof siqs.siqs === 'number') {
      return normalizeToSiqsScale(siqs.siqs);
    }
  }
  
  return 0;
}

/**
 * Normalizes a SIQS score to ensure it's on a scale of 0-10
 * @param score The raw SIQS score
 * @returns The normalized score on a scale of 0-10
 */
export function normalizeToSiqsScale(score: number): number {
  if (score <= 0) {
    return 0;
  }
  
  // If score is already in the range of 0-10, return it as is
  if (score <= 10) {
    return score;
  }
  
  // If score is on a scale of 0-100, convert to 0-10
  if (score <= 100) {
    return score / 10;
  }
  
  // For any other larger scale, normalize to 0-10 range
  return 10;
}

/**
 * Format SIQS score for display
 * @param score The SIQS score
 * @returns Formatted string representation
 */
export function formatSiqsForDisplay(score: number | null): string {
  if (score === null || score === undefined) {
    return '0.0';
  }
  
  // Ensure score is a number and within valid range
  const normalizedScore = normalizeToSiqsScale(Number(score));
  
  // Format to one decimal place
  return normalizedScore.toFixed(1);
}

/**
 * Check if a SIQS score is greater than a threshold
 * @param siqs The SIQS data
 * @param threshold Threshold value to compare against
 * @returns Boolean indicating if SIQS is greater than threshold
 */
export function isSiqsGreaterThan(siqs: any, threshold: number): boolean {
  const score = getSiqsScore(siqs);
  return score > threshold;
}

/**
 * Check if a SIQS score is at least a threshold
 * @param siqs The SIQS data
 * @param threshold Threshold value to compare against
 * @returns Boolean indicating if SIQS is at least the threshold
 */
export function isSiqsAtLeast(siqs: any, threshold: number): boolean {
  const score = getSiqsScore(siqs);
  return score >= threshold;
}

/**
 * Sort locations by their SIQS scores in descending order
 * @param locations Array of locations with SIQS data
 * @returns Sorted array of locations
 */
export function sortLocationsBySiqs(locations: any[]): any[] {
  if (!Array.isArray(locations)) return [];
  
  return [...locations].sort((a, b) => {
    const scoreA = getSiqsScore(a.siqs);
    const scoreB = getSiqsScore(b.siqs);
    
    // Sort by SIQS score descending (highest first)
    if (scoreA !== scoreB) {
      return scoreB - scoreA;
    }
    
    // If SIQS scores are equal, prefer certified locations
    const aIsCertified = Boolean(a.certification || a.isDarkSkyReserve);
    const bIsCertified = Boolean(b.certification || b.isDarkSkyReserve);
    
    if (aIsCertified !== bIsCertified) {
      return aIsCertified ? -1 : 1;
    }
    
    // If still tied, sort by name
    return (a.name || '').localeCompare(b.name || '');
  });
}

/**
 * Convert a SIQS score to a quality level descriptor
 * @param score The SIQS score
 * @returns Quality level string
 */
export function getSiqsQualityLevel(score: number): string {
  if (score >= 8) return 'excellent';
  if (score >= 6) return 'good';
  if (score >= 4) return 'average';
  if (score >= 2) return 'poor';
  return 'bad';
}

/**
 * Convert a SIQS score to a color
 * @param score The SIQS score
 * @returns CSS color string
 */
export function getSiqsColor(score: number): string {
  if (score >= 8) return 'text-green-500';
  if (score >= 6) return 'text-yellow-400';
  if (score >= 4) return 'text-amber-500';
  if (score >= 2) return 'text-orange-500';
  return 'text-red-500';
}
