
/**
 * SIQS Display Formatting Utilities
 */

import { getSiqsScore } from '@/utils/siqsHelpers';

// Default SIQS values
export const DEFAULT_SIQS = 0; // No default scores, use 0 instead

/**
 * Format a SIQS score for display 
 */
export function formatSiqsForDisplay(score: number | null): string {
  if (score === null || score <= 0) return 'N/A';
  
  // Format to one decimal point
  const formatted = score.toFixed(1);
  
  // Remove trailing zeros if it's a whole number
  return formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted;
}

/**
 * Get the SIQS value from a location object
 */
export function getLocationSiqs(location: any): number {
  if (!location) return 0;
  
  // Extract SIQS from various possible structures
  return getSiqsScore(location.siqs || location.siqs_score || location.siqsResult?.score || 0);
}

/**
 * Get the display SIQS value based on available data
 */
export function getDisplaySiqs(options: {
  realTimeSiqs: number | null;
  staticSiqs: number;
  isCertified?: boolean;
  isDarkSkyReserve?: boolean;
}): number {
  const { realTimeSiqs, staticSiqs, isCertified = false } = options;
  
  // Always prefer real-time SIQS if available
  if (realTimeSiqs !== null && realTimeSiqs > 0) {
    return realTimeSiqs;
  }
  
  // Use static SIQS if available
  if (staticSiqs > 0) {
    return staticSiqs;
  }
  
  // No default scores
  return 0;
}

/**
 * Calculate a simplified SIQS score based on cloud cover and bortle scale
 */
export function calculateSimplifiedSiqs(cloudCover: number, bortleScale: number = 4): number {
  // Base score inversely related to Bortle Scale (1-9)
  const baseScore = Math.max(0, 10 - bortleScale);
  
  // Cloud factor (0-100% -> 0-1 factor reduction)
  const cloudFactor = Math.max(0, 1 - (cloudCover / 100));
  
  // Calculate final score (0-10 scale)
  const finalScore = baseScore * cloudFactor;
  
  // Round to 1 decimal place
  return Math.round(finalScore * 10) / 10;
}
