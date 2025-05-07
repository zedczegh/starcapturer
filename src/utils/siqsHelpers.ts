
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
