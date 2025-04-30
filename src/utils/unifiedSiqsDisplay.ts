
/**
 * Utility functions for unified SIQS display across the application
 * This ensures consistency in how SIQS scores are displayed
 */

import { normalizeToSiqsScale } from './siqsHelpers';

interface GetDisplaySiqsOptions {
  realTimeSiqs: number | null;
  staticSiqs: number | null;
  isCertified?: boolean;
  isDarkSkyReserve?: boolean;
  minimumCertifiedScore?: number;
}

/**
 * Get the display SIQS score based on available data sources
 * Prioritizes real-time SIQS data when available
 * 
 * @param options Options for determining the display SIQS
 * @returns The SIQS value to display or null if no valid score
 */
export function getDisplaySiqs(options: GetDisplaySiqsOptions): number | null {
  const {
    realTimeSiqs,
    staticSiqs,
    isCertified = false,
    isDarkSkyReserve = false,
    minimumCertifiedScore = 7.0
  } = options;
  
  // Use real-time SIQS if available
  if (realTimeSiqs !== null && realTimeSiqs > 0) {
    return realTimeSiqs;
  }
  
  // Use static SIQS if available
  if (staticSiqs !== null && staticSiqs > 0) {
    return staticSiqs;
  }
  
  // For certified locations with no score, provide a default minimum
  if (isCertified || isDarkSkyReserve) {
    return minimumCertifiedScore;
  }
  
  // No valid score available
  return null;
}

/**
 * Calculate a confidence score for SIQS display
 * 
 * @param realTime Whether real-time data is available
 * @param isCertified Whether the location is certified 
 * @param hasWeatherData Whether weather data is available
 * @returns A confidence score between 0-10
 */
export function getSiqsConfidenceScore(
  realTime: boolean,
  isCertified: boolean,
  hasWeatherData: boolean
): number {
  let score = 5; // Base score
  
  if (realTime) score += 3;
  if (isCertified) score += 2;
  if (hasWeatherData) score += 2;
  
  return Math.min(10, score);
}
