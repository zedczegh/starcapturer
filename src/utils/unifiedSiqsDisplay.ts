
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

// Constants for default SIQS values
export const DEFAULT_SIQS = 0;
export const CERTIFIED_DEFAULT_SIQS = 6.5;
export const DARK_SKY_RESERVE_DEFAULT_SIQS = 7.5;

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
 * and location certification status
 */
export function getDisplaySiqs(options: {
  realTimeSiqs: number | null;
  staticSiqs: number;
  isCertified: boolean;
  isDarkSkyReserve: boolean;
}): number {
  const { realTimeSiqs, staticSiqs, isCertified, isDarkSkyReserve } = options;
  
  // Use realtime SIQS if available
  if (realTimeSiqs !== null && realTimeSiqs > 0) {
    return realTimeSiqs;
  }
  
  // Use static SIQS if available
  if (staticSiqs > 0) {
    return staticSiqs;
  }
  
  // Default values based on certification
  if (isDarkSkyReserve) {
    return DARK_SKY_RESERVE_DEFAULT_SIQS;
  }
  
  if (isCertified) {
    return CERTIFIED_DEFAULT_SIQS;
  }
  
  return DEFAULT_SIQS;
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
  
  return siqs.toFixed(1);
}

/**
 * Get cached SIQS with optimized performance
 */
export function getCachedRealTimeSiqs(latitude: number, longitude: number): number | null {
  if (hasCachedSiqs(latitude, longitude)) {
    const cached = getCachedSiqs(latitude, longitude);
    if (cached && cached.siqs > 0) {
      return cached.siqs;
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
  
  // Default result
  const defaultSiqs = isDarkSkyReserve ? DARK_SKY_RESERVE_DEFAULT_SIQS : 
                      isCertified ? CERTIFIED_DEFAULT_SIQS : 
                      existingSiqs !== null ? getSiqsScore(existingSiqs) : DEFAULT_SIQS;
                      
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
    
    // Calculate real-time SIQS if no cache available
    const result = await calculateRealTimeSiqs(
      latitude,
      longitude,
      isCertified ? Math.min(bortleScale, 4) : bortleScale
    );
    
    if (result && result.siqs > 0) {
      // For certified locations, ensure minimum scores
      let finalScore = result.siqs;
      if (isDarkSkyReserve) {
        finalScore = Math.max(finalScore, DARK_SKY_RESERVE_DEFAULT_SIQS);
      } else if (isCertified) {
        finalScore = Math.max(finalScore, CERTIFIED_DEFAULT_SIQS);
      }
      
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
