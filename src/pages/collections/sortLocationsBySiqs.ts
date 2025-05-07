
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { getSiqsScore } from "@/utils/siqsHelpers";

/**
 * Sort locations by their SIQS score (highest first)
 */
export function sortLocationsBySiqs(locations: SharedAstroSpot[]): SharedAstroSpot[] {
  return [...locations].sort((a, b) => {
    const aSiqs = getSiqsScore(a.siqs) || 0;
    const bSiqs = getSiqsScore(b.siqs) || 0;
    return bSiqs - aSiqs;
  });
}

export default sortLocationsBySiqs;
