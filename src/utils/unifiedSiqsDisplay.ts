
/**
 * Unified SIQS display utilities
 * Provides consistent SIQS formatting and normalization across the app
 */

import { normalizeToSiqsScale } from './siqsHelpers';

// Define SiqsDisplayOpts type for consistency
export interface SiqsDisplayOpts {
  isCertified?: boolean;
  isDarkSkyReserve?: boolean;
  confidence?: number;
  includeQuality?: boolean;
}

/**
 * Get normalized and display-ready SIQS score
 * Handles all possible SIQS formats and returns a consistent value
 */
export const getDisplaySiqs = (siqs: any): number | null => {
  // Handle null/undefined
  if (!siqs) return null;
  
  // Handle numeric value
  if (typeof siqs === 'number') {
    return normalizeToSiqsScale(siqs);
  }
  
  // Handle object with score property
  if (typeof siqs === 'object') {
    if ('score' in siqs && typeof siqs.score === 'number') {
      return normalizeToSiqsScale(siqs.score);
    }
    
    if ('siqs' in siqs && typeof siqs.siqs === 'number') {
      return normalizeToSiqsScale(siqs.siqs);
    }
  }
  
  // Couldn't find a valid SIQS value
  return null;
};

/**
 * Format SIQS value for display
 */
export const formatSiqsForDisplay = (siqs: any): string => {
  const displaySiqs = getDisplaySiqs(siqs);
  
  if (displaySiqs === null || displaySiqs <= 0) {
    return 'N/A';
  }
  
  return displaySiqs.toFixed(1);
};

/**
 * Get SIQS quality level text
 */
export const getSiqsQualityText = (siqs: any): string => {
  const normalizedSiqs = getDisplaySiqs(siqs);
  
  if (normalizedSiqs === null) return 'Unknown';
  
  if (normalizedSiqs >= 8) return 'Excellent';
  if (normalizedSiqs >= 6) return 'Good';
  if (normalizedSiqs >= 4) return 'Average';
  if (normalizedSiqs >= 2) return 'Poor';
  return 'Bad';
};

/**
 * Get complete SIQS display information
 * Returns an object with score, quality text, and other properties
 */
export const getCompleteSiqsDisplay = (siqs: any, options?: SiqsDisplayOpts) => {
  const score = getDisplaySiqs(siqs);
  const qualityText = options?.includeQuality ? getSiqsQualityText(siqs) : null;
  
  return {
    score,
    formattedScore: formatSiqsForDisplay(siqs),
    qualityText,
    isCertified: options?.isCertified || false,
    isDarkSkyReserve: options?.isDarkSkyReserve || false,
    confidence: options?.confidence || 10
  };
};
