
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

export interface SiqsDisplayOptions {
  latitude: number;
  longitude: number;
  bortleScale?: number;
  isCertified?: boolean;
  isDarkSkyReserve?: boolean;
  existingSiqs?: number | any;
  skipCache?: boolean;
  useSingleHourSampling?: boolean;
  targetHour?: number;
  cacheDurationMins?: number;
}

export interface SiqsResult {
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
export function getCachedRealTimeSiqs(latitude: number, longitude: number, skipCache: boolean = false): number | null {
  if (!skipCache && hasCachedSiqs(latitude, longitude)) {
    const cached = getCachedSiqs(latitude, longitude);
    if (cached && cached.siqs > 0) {
      return normalizeToSiqsScale(cached.siqs);
    }
  }
  return null;
}

/**
 * All-in-one function to get complete SIQS display information
 */
export async function getCompleteSiqsDisplay(options: SiqsDisplayOptions): Promise<SiqsResult> {
  const { 
    latitude, 
    longitude, 
    bortleScale = 4, 
    isCertified = false, 
    isDarkSkyReserve = false,
    existingSiqs = null,
    skipCache = false,
    useSingleHourSampling = true,
    targetHour = 1,
    cacheDurationMins = 15
  } = options;
  
  // Get existing SIQS, without defaults - never use default scores
  const staticSiqs = existingSiqs !== null ? getSiqsScore(existingSiqs) : 0;
                      
  const defaultResult: SiqsResult = {
    siqs: 0, // Never use default scores - return 0 instead
    loading: isCertified, // Show loading for certified locations with no score
    formattedSiqs: formatSiqsForDisplay(staticSiqs > 0 ? staticSiqs : null),
    colorClass: getSiqsColorClass(staticSiqs),
    source: 'default'
  };
  
  // Check for invalid coordinates
  if (!isFinite(latitude) || !isFinite(longitude)) {
    return defaultResult;
  }
  
  try {
    // Try to get cached SIQS first (unless we're skipping cache)
    if (!skipCache) {
      const cachedSiqs = getCachedRealTimeSiqs(latitude, longitude);
      if (cachedSiqs !== null) {
        // Ensure the cached SIQS is on the 0-10 scale
        const normalizedSiqs = normalizeToSiqsScale(cachedSiqs);
        return {
          siqs: normalizedSiqs,
          loading: false,
          formattedSiqs: formatSiqsForDisplay(normalizedSiqs),
          colorClass: getSiqsColorClass(normalizedSiqs),
          source: 'cached'
        };
      }
    }
    
    // Calculate real-time SIQS
    const result = await calculateRealTimeSiqs(
      latitude,
      longitude,
      bortleScale,
      {
        useSingleHourSampling,
        targetHour,
        cacheDurationMins
      }
    );
    
    if (result && result.siqs > 0) {
      // Use actual calculated score
      const finalScore = result.siqs;
      
      // Cache the result to avoid repeated calculations
      setSiqsCache(latitude, longitude, result);
      
      return {
        siqs: finalScore,
        loading: false,
        formattedSiqs: formatSiqsForDisplay(finalScore),
        colorClass: getSiqsColorClass(finalScore),
        source: 'realtime'
      };
    }
    
    return defaultResult;
  } catch (error) {
    console.error("Error getting SIQS display data:", error);
    return defaultResult;
  }
}
