
import { SharedAstroSpot } from "@/lib/api/astroSpots";

// Helper function to get numeric SIQS score from either number or object format
export function getSiqsScore(siqs: number | { score: number; isViable: boolean }): number {
  if (typeof siqs === 'number') {
    return siqs;
  } else if (siqs && typeof siqs === 'object' && 'score' in siqs) {
    return siqs.score;
  }
  return 0;
}

// Helper function to format SIQS score for display
export function formatSiqsForDisplay(siqs: number | { score: number; isViable: boolean } | null): string {
  if (siqs === null) return "N/A";
  
  const score = getSiqsScore(siqs);
  return score > 0 ? score.toFixed(1) : "N/A";
}

// Helper function to check if SIQS is greater than a threshold
export function isSiqsGreaterThan(siqs: number | { score: number; isViable: boolean } | null, threshold: number): boolean {
  if (siqs === null) return false;
  return getSiqsScore(siqs) > threshold;
}

// Helper function to sort locations by SIQS score (highest first)
export function sortLocationsBySiqs(locations: SharedAstroSpot[]): SharedAstroSpot[] {
  return [...locations].sort((a, b) => {
    const scoreA = a.siqs ? getSiqsScore(a.siqs) : 0;
    const scoreB = b.siqs ? getSiqsScore(b.siqs) : 0;
    return scoreB - scoreA;
  });
}
