
/**
 * SIQS Display Formatters
 */

import { normalizeToSiqsScale } from '@/utils/siqsHelpers';
import { getSiqsColorClass } from '@/utils/mapSiqsDisplay';

// Default SIQS value constant
export const DEFAULT_SIQS = 0;

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

// Helper function for simplified SIQS calculation based on cloud cover
export function calculateSimplifiedSiqs(cloudCover: number, bortleScale: number = 4): number {
  // Base score determined by cloud cover (0-100%)
  // 0% clouds = 10, 100% clouds = 0
  const cloudScore = Math.max(0, 10 - (cloudCover / 10));
  
  // Adjust for Bortle scale (1-9)
  // Lower Bortle = better score
  const bortleAdjustment = Math.max(0, 5 - (bortleScale / 2));
  
  // Simple weighted combination
  // 70% cloud cover, 30% Bortle scale
  const rawScore = (cloudScore * 0.7) + (bortleAdjustment * 0.3);
  
  // Round to one decimal place and ensure within 0-10 range
  return Math.round(Math.min(10, Math.max(0, rawScore)) * 10) / 10;
}

// Import from siqsHelpers but defined here to avoid circular dependencies
export const getSiqsScore = (location: any): number => {
  if (!location) return 0;
  
  // Handle if it's a raw siqs value
  if (typeof location === 'number') return location;
  
  // Handle location object with score field
  if (location.score !== undefined) return location.score;
  if (location.siqs !== undefined) return location.siqs;
  if (location.siqsScore !== undefined) return location.siqsScore;
  
  // Handle location with siqsResult object
  if (location.siqsResult?.score !== undefined) return location.siqsResult.score;
  
  return 0;
};
