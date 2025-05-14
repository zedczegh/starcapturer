
/**
 * SIQS Helpers - Utility functions for normalizing and displaying SIQS scores
 */

/**
 * Normalize a value to ensure it's on the 0-10 SIQS scale
 */
export function normalizeToSiqsScale(value: number): number {
  // If value is already in the 0-10 range, return it
  if (value >= 0 && value <= 10) {
    return value;
  }
  
  // If value is on a 0-100 scale, convert to 0-10
  if (value > 10 && value <= 100) {
    return value / 10;
  }
  
  // For negative values or extremely large values, clamp to 0-10 range
  return Math.max(0, Math.min(10, value));
}

/**
 * Format a SIQS score for display with consistent precision
 */
export function formatSiqsForDisplay(score: number | null): string {
  if (score === null || score <= 0) {
    return "N/A";
  }
  
  // Normalize the score first to ensure it's on the correct scale
  const normalizedScore = normalizeToSiqsScale(score);
  
  // Format to 1 decimal place
  return normalizedScore.toFixed(1);
}

/**
 * Extract a numeric SIQS score from various possible formats
 */
export function getSiqsScore(score: number | any): number {
  if (typeof score === 'number') {
    return score;
  }
  
  if (score && typeof score === 'object') {
    if ('score' in score && typeof score.score === 'number') {
      return score.score;
    }
    if ('siqs' in score && typeof score.siqs === 'number') {
      return score.siqs;
    }
  }
  
  return 0;
}

/**
 * Get a unified SIQS display value from potentially inconsistent sources
 */
export function getDisplaySiqs(siqsData: any): number | null {
  const score = getSiqsScore(siqsData);
  return score > 0 ? normalizeToSiqsScale(score) : null;
}

/**
 * Calculate a simplified SIQS score based on Bortle scale alone
 * This is used as a fallback when no other data is available
 */
export function getBortleBasedSiqs(bortleScale: number): number {
  if (!bortleScale || bortleScale < 1 || bortleScale > 9) {
    return 5; // Default middle score if Bortle is invalid
  }
  
  // Simple inverse relationship - higher Bortle means lower SIQS
  return 10 - bortleScale * 0.8;
}

/**
 * Check if one SIQS score is greater than another
 * Handles various input formats and normalizes before comparing
 */
export function isSiqsGreaterThan(a: number | any, b: number | any): boolean {
  const scoreA = getSiqsScore(a);
  const scoreB = getSiqsScore(b);
  return normalizeToSiqsScale(scoreA) > normalizeToSiqsScale(scoreB);
}

/**
 * Check if a SIQS score is at least a certain value
 * Handles various input formats and normalizes before comparing
 */
export function isSiqsAtLeast(a: number | any, b: number | any): boolean {
  const scoreA = getSiqsScore(a);
  const scoreB = getSiqsScore(b);
  return normalizeToSiqsScale(scoreA) >= normalizeToSiqsScale(scoreB);
}

/**
 * Sort locations by their SIQS scores (highest first)
 * Handles locations with various SIQS score formats
 */
export function sortLocationsBySiqs(locations: any[]): any[] {
  if (!Array.isArray(locations)) return [];
  
  return [...locations].sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;
    
    // Try to get SIQS from various possible properties
    if (a) {
      if (a.realTimeSiqs !== undefined) scoreA = getSiqsScore(a.realTimeSiqs);
      else if (a.siqs !== undefined) scoreA = getSiqsScore(a.siqs);
      else if (a.siqsResult) scoreA = getSiqsScore(a.siqsResult);
    }
    
    if (b) {
      if (b.realTimeSiqs !== undefined) scoreB = getSiqsScore(b.realTimeSiqs);
      else if (b.siqs !== undefined) scoreB = getSiqsScore(b.siqs);
      else if (b.siqsResult) scoreB = getSiqsScore(b.siqsResult);
    }
    
    // Sort descending (highest SIQS first)
    return scoreB - scoreA;
  });
}
