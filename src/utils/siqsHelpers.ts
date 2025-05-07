
import { SharedAstroSpot } from "@/lib/api/astroSpots";

/**
 * Gets the score value from different SIQS score formats
 */
export function getSiqsScore(siqs?: number | { score: number; isViable: boolean }): number {
  if (siqs === undefined) return 0;
  if (typeof siqs === 'number') return siqs;
  return siqs.score;
}

/**
 * Format SIQS score for display
 */
export function formatSiqsScore(score?: number | null): string {
  if (score === undefined || score === null) return 'N/A';
  return score.toFixed(1);
}

/**
 * Format SIQS score for display with consistent formatting
 * Works with null values and returns N/A
 */
export function formatSiqsForDisplay(siqs: number | null): string {
  if (siqs === null || siqs <= 0) {
    return "N/A";
  }
  
  // Normalize before displaying
  return normalizeToSiqsScale(siqs).toFixed(1);
}

/**
 * Normalize a SIQS score to the 0-10 scale
 * Some systems use 0-100 scale, this ensures consistency
 */
export function normalizeToSiqsScale(score: number): number {
  // If score is already within 0-10 range, return as is
  if (score >= 0 && score <= 10) {
    return score;
  }
  
  // If score is on 0-100 scale, convert to 0-10
  if (score > 10 && score <= 100) {
    return score / 10;
  }
  
  // For any other unusual values, clamp to 0-10 range
  return Math.max(0, Math.min(10, score));
}

/**
 * Compare if a SIQS score is greater than a threshold
 */
export function isSiqsGreaterThan(siqs: number | { score: number; isViable: boolean } | undefined, threshold: number): boolean {
  if (siqs === undefined) return false;
  const score = getSiqsScore(siqs);
  return score > threshold;
}

/**
 * Compare if a SIQS score is at least a threshold value
 */
export function isSiqsAtLeast(siqs: number | { score: number; isViable: boolean } | undefined, threshold: number): boolean {
  if (siqs === undefined) return false;
  const score = getSiqsScore(siqs);
  return score >= threshold;
}

/**
 * Sort locations by their highest available SIQS score (descending)
 * Uses either realTimeSiqs (if present and accessible as a property), or static siqs
 */
export function sortLocationsBySiqs(locations: SharedAstroSpot[]): SharedAstroSpot[] {
  return [...locations].sort((a, b) => {
    // Safely check for realTimeSiqs using type assertion or index access
    // as the property might be added dynamically in runtime but not in the type definition
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
