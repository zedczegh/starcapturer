
/**
 * Unified SIQS Display Utility
 * 
 * This file provides a single source of truth for displaying SIQS scores
 * consistently across all map markers and popups.
 */

import { getSiqsScore } from './siqsHelpers';
import { formatMapSiqs, getSiqsColorClass } from './mapSiqsDisplay';
import { calculateRealTimeSiqs } from '@/services/realTimeSiqs/siqsCalculator';
import { hasCachedSiqs, getCachedSiqs } from '@/services/realTimeSiqs/siqsCache';

// Constants for default SIQS values - but we won't use these for certified locations anymore
export const DEFAULT_SIQS = 0;

interface SiqsDisplayOptions {
  latitude: number;
  longitude: number;
  bortleScale?: number;
  isCertified?: boolean;
  isDarkSkyReserve?: boolean;
  existingSiqs?: number | any;
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
 * Treats certified locations the same as calculated spots - no default scores
 */
export function getDisplaySiqs(options: {
  realTimeSiqs: number | null;
  staticSiqs: number;
  isCertified: boolean;
  isDarkSkyReserve: boolean;
}): number {
  const { realTimeSiqs, staticSiqs } = options;
  
  // Normalize to 1-10 scale if needed
  let normalizedRealTimeSiqs = realTimeSiqs;
  if (normalizedRealTimeSiqs && normalizedRealTimeSiqs > 10) {
    normalizedRealTimeSiqs = normalizedRealTimeSiqs / 10;
  }
  
  let normalizedStaticSiqs = staticSiqs;
  if (normalizedStaticSiqs > 10) {
    normalizedStaticSiqs = normalizedStaticSiqs / 10;
  }
  
  // Use realtime SIQS if available
  if (normalizedRealTimeSiqs !== null && normalizedRealTimeSiqs > 0) {
    return normalizedRealTimeSiqs;
  }
  
  // Use static SIQS if available
  if (normalizedStaticSiqs > 0) {
    return normalizedStaticSiqs;
  }
  
  // No default scores for certified locations anymore
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
  let staticSiqs = getSiqsScore(location);
  
  // Normalize to 1-10 scale if needed
  if (staticSiqs > 10) {
    staticSiqs = staticSiqs / 10;
  }
  
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
  
  // Ensure SIQS is in 1-10 scale
  const normalizedSiqs = siqs > 10 ? siqs / 10 : siqs;
  return normalizedSiqs.toFixed(1);
}

/**
 * Get cached SIQS with optimized performance
 */
export function getCachedRealTimeSiqs(latitude: number, longitude: number): number | null {
  if (hasCachedSiqs(latitude, longitude)) {
    const cached = getCachedSiqs(latitude, longitude);
    if (cached && cached.siqs > 0) {
      // Normalize to 1-10 scale if needed
      const normalizedSiqs = cached.siqs > 10 ? cached.siqs / 10 : cached.siqs;
      return normalizedSiqs;
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
    existingSiqs = null
  } = options;
  
  // Default result - no special treatment for certified locations
  let defaultSiqs = existingSiqs !== null ? getSiqsScore(existingSiqs) : DEFAULT_SIQS;
  
  // Normalize to 1-10 scale if needed
  if (defaultSiqs > 10) {
    defaultSiqs = defaultSiqs / 10;
  }
                      
  const defaultResult: SiqsResult = {
    siqs: defaultSiqs,
    loading: false,
    formattedSiqs: formatSiqsForDisplay(defaultSiqs),
    colorClass: getSiqsColorClass(defaultSiqs),
    source: 'default'
  };
  
  // Check for invalid coordinates
  if (!isFinite(latitude) || !isFinite(longitude)) {
    return defaultResult;
  }
  
  try {
    // Try to get cached SIQS first
    const cachedSiqs = getCachedRealTimeSiqs(latitude, longitude);
    if (cachedSiqs !== null) {
      return {
        siqs: cachedSiqs,
        loading: false,
        formattedSiqs: formatSiqsForDisplay(cachedSiqs),
        colorClass: getSiqsColorClass(cachedSiqs),
        source: 'cached'
      };
    }
    
    // Calculate real-time SIQS if no cache available - use same bortleScale for all locations
    const result = await calculateRealTimeSiqs(
      latitude,
      longitude,
      bortleScale
    );
    
    if (result && result.siqs > 0) {
      // No special treatment for certified locations
      // Normalize to 1-10 scale if needed
      const finalScore = result.siqs > 10 ? result.siqs / 10 : result.siqs;
      
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
