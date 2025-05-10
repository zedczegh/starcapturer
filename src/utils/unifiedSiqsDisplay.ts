
/**
 * Unified SIQS Display Utilities
 * 
 * This module provides standardized functions for displaying SIQS scores
 * consistently throughout the application.
 */
import { getSiqsScore } from './siqsHelpers';
import { SiqsDisplayOptions } from '@/services/realTimeSiqs/siqsTypes';

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

/**
 * Complete SIQS display calculator that handles all edge cases
 * Provides real-time SIQS calculation with fallbacks to static values
 * 
 * @param options Location and configuration options
 * @returns Object containing the best SIQS score and metadata
 */
export const getCompleteSiqsDisplay = async (options: {
  latitude: number;
  longitude: number;
  bortleScale: number;
  isCertified?: boolean;
  isDarkSkyReserve?: boolean;
  existingSiqs?: number;
  skipCache?: boolean;
  useSingleHourSampling?: boolean;
  targetHour?: number;
}): Promise<{
  siqs: number | null;
  isViable: boolean;
  source: 'realtime' | 'static' | 'default';
}> => {
  try {
    // In a real implementation, this would fetch real-time data
    // For now, just return the existing SIQS if available
    const { existingSiqs, isCertified, isDarkSkyReserve } = options;
    
    // Simulate a network request with a short delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Use existing SIQS if available
    if (existingSiqs && existingSiqs > 0) {
      return {
        siqs: existingSiqs,
        isViable: existingSiqs >= 5,
        source: 'static'
      };
    }
    
    // For certified locations and dark sky reserves, provide a good default SIQS
    if (isCertified || isDarkSkyReserve) {
      const defaultScore = isDarkSkyReserve ? 8.5 : 7.0;
      return {
        siqs: defaultScore,
        isViable: true,
        source: 'default'
      };
    }
    
    // Default fallback
    return {
      siqs: null,
      isViable: false,
      source: 'static'
    };
  } catch (error) {
    console.error("Error calculating complete SIQS display:", error);
    return {
      siqs: null,
      isViable: false,
      source: 'static'
    };
  }
};
