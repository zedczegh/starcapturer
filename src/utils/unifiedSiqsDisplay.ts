
/**
 * Unified SIQS Display Utility
 * 
 * This file provides a single source of truth for displaying SIQS scores
 * consistently across all map markers and popups.
 */

import { getSiqsScore, normalizeToSiqsScale } from './siqsHelpers';
import { formatMapSiqs, getSiqsColorClass } from './mapSiqsDisplay';
import { calculateRealTimeSiqs } from '@/services/realTimeSiqs/siqsCalculator';
import { hasCachedSiqs, getCachedSiqs, setSiqsCache } from '@/services/realTimeSiqs/siqsCache';

// No default SIQS values, show loading state or nothing instead
export const DEFAULT_SIQS = 0;

interface SiqsDisplayOptions {
  latitude: number;
  longitude: number;
  bortleScale?: number;
  isCertified?: boolean;
  isDarkSkyReserve?: boolean;
  existingSiqs?: number | any;
  skipCache?: boolean;
}

interface SiqsResult {
  siqs: number;
  loading: boolean;
  formattedSiqs: string;
  colorClass: string;
  source: 'realtime' | 'cached' | 'default';
}

/**
 * Get the appropriate display SIQS score based on available data
 * Never use default scores - return 0 if no real data available
 */
export function getDisplaySiqs(options: {
  realTimeSiqs: number | null;
  staticSiqs: number;
  isCertified: boolean;
  isDarkSkyReserve: boolean;
}): number {
  const { realTimeSiqs, staticSiqs } = options;
  
  // Use realtime SIQS if available, ensuring it's on 0-10 scale
  if (realTimeSiqs !== null && realTimeSiqs > 0) {
    return normalizeToSiqsScale(realTimeSiqs);
  }
  
  // Use static SIQS if available, ensuring it's on 0-10 scale
  if (staticSiqs > 0) {
    return normalizeToSiqsScale(staticSiqs);
  }
  
  // Return 0 for no valid score - will trigger loading state or no display
  return 0;
}

/**
 * Get the appropriate SIQS score from any location object
 */
export function getLocationSiqs(location: any, realTimeSiqs: number | null = null): number {
  // Extract certification status
  const isCertified = Boolean(
    location?.isDarkSkyReserve || 
    location?.certification || 
    location?.type === 'lodging' || 
    location?.type === 'dark-site'
  );
  
  const isDarkSkyReserve = Boolean(location?.isDarkSkyReserve);
  
  // Get static SIQS from location
  const staticSiqs = getSiqsScore(location);
  
  // Get appropriate display SIQS
  return getDisplaySiqs({
    realTimeSiqs,
    staticSiqs,
    isCertified,
    isDarkSkyReserve
  });
}

/**
 * Format SIQS for display with consistent formatting
 */
export function formatSiqsForDisplay(siqs: number | null): string {
  if (siqs === null || siqs <= 0) {
    return "N/A";
  }
  
  // Normalize before displaying
  return normalizeToSiqsScale(siqs).toFixed(1);
}

/**
 * Get cached SIQS with optimized performance
 */
export async function getCachedOrCalculateSiqs(
  latitude: number,
  longitude: number,
  bortleScale: number = 4
): Promise<number> {
  // First check for cached value
  if (hasCachedSiqs(latitude, longitude)) {
    const cached = getCachedSiqs(latitude, longitude);
    if (cached && cached.siqs > 0) {
      return cached.siqs;
    }
  }
  
  try {
    // Calculate if not cached
    const result = await calculateRealTimeSiqs(latitude, longitude, bortleScale);
    if (result && result.siqs > 0) {
      return result.siqs;
    }
  } catch (error) {
    console.error("Error calculating SIQS:", error);
  }
  
  // Default fallback
  return 0;
}
