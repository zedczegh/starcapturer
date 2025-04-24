
/**
 * Unified SIQS display utility to consistently handle SIQS scores
 * across different components and views
 */
import { normalizeToSiqsScale, getSiqsScore } from './siqsHelpers';

interface DisplaySiqsOptions {
  realTimeSiqs: number | null;
  staticSiqs?: number | null | { score: number; isViable: boolean } | any;
  isCertified?: boolean;
  isDarkSkyReserve?: boolean;
  confidenceThreshold?: number;
}

/**
 * Get the best available SIQS score for display based on available data
 * and location certification status
 */
export function getDisplaySiqs({
  realTimeSiqs,
  staticSiqs = null,
  isCertified = false,
  isDarkSkyReserve = false,
  confidenceThreshold = 6
}: DisplaySiqsOptions): number | null {
  // First priority: real-time SIQS if available
  if (realTimeSiqs !== null && realTimeSiqs > 0) {
    return normalizeToSiqsScale(realTimeSiqs);
  }
  
  // Second priority: static/stored SIQS if available
  if (staticSiqs !== null) {
    const normalizedStaticSiqs = getSiqsScore(staticSiqs);
    if (normalizedStaticSiqs > 0) {
      return normalizedStaticSiqs;
    }
  }
  
  // For certified or dark sky locations, show a default score if no actual data
  if ((isCertified || isDarkSkyReserve) && (realTimeSiqs === null || realTimeSiqs <= 0)) {
    return isDarkSkyReserve ? 8.5 : 7.5; // Higher default for dark sky reserves
  }
  
  // No valid score available
  return null;
}
