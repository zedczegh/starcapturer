
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { getSiqsScore } from "@/utils/siqsHelpers";

/**
 * Sort locations by their highest available SIQS score (descending)
 * Uses either realTimeSiqs (if present), or static siqs
 */
export function sortLocationsBySiqs(locations: SharedAstroSpot[]): SharedAstroSpot[] {
  // We assume that if a "realTimeSiqs" property is present, use that, otherwise fallback to siqs.
  return [...locations].sort((a, b) => {
    const aSiqs = typeof a.realTimeSiqs === "number" && a.realTimeSiqs > 0
      ? a.realTimeSiqs
      : getSiqsScore(a.siqs);
    const bSiqs = typeof b.realTimeSiqs === "number" && b.realTimeSiqs > 0
      ? b.realTimeSiqs
      : getSiqsScore(b.siqs);
    return (bSiqs || 0) - (aSiqs || 0);
  });
}
