/**
 * Unified SIQS Display Utilities
 * 
 * This module provides standardized functions for displaying SIQS scores
 * consistently throughout the application.
 */
import { getSiqsScore } from './siqsHelpers';

/**
 * Options for configuring SIQS display
 */
export interface SiqsDisplayOptions {
  // Whether to use default scores for certified locations
  useDefaultForCertified?: boolean;
  // Whether to apply special styling for dark sky reserves
  specialStylingForReserves?: boolean;
}

/**
 * Get the best available SIQS score for display
 * 
 * @param options Configuration options
 * @returns The best SIQS score to display, or null if none available
 */
export const getDisplaySiqs = (options: {
  realTimeSiqs: number | null;
  staticSiqs: number;
  isCertified: boolean;
  isDarkSkyReserve?: boolean;
}): number | null => {
  const { realTimeSiqs, staticSiqs, isCertified } = options;
  
  // Always prefer real-time SIQS if available
  if (realTimeSiqs !== null && realTimeSiqs > 0) {
    return realTimeSiqs;
  }
  
  // Use static SIQS if available
  if (staticSiqs && staticSiqs > 0) {
    return staticSiqs;
  }
  
  // For certified locations, return whatever score is available, even if 0
  if (isCertified) {
    return staticSiqs > 0 ? staticSiqs : null;
  }
  
  // Otherwise return null to indicate no valid score
  return null;
};
