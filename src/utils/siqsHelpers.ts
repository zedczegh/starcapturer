
/**
 * Helper utilities for SIQS calculations and display
 */

/**
 * Extract SIQS score safely from potentially complex SIQS data
 * @param siqs - SIQS value which could be a number, object with score property, or null
 * @returns numeric SIQS score or 0 if unavailable
 */
export const getSiqsScore = (siqs: number | { score: number; isViable: boolean; } | { siqs: number; isViable: boolean; } | null | undefined): number => {
  if (siqs === null || siqs === undefined) {
    return 0;
  }
  
  if (typeof siqs === 'number') {
    return siqs;
  }
  
  if ('score' in siqs) {
    return siqs.score;
  }
  
  if ('siqs' in siqs) {
    return siqs.siqs;
  }
  
  return 0;
};

/**
 * Determine if viewing conditions are viable based on SIQS data
 * @param siqs - SIQS value in various formats
 * @returns boolean indicating viability
 */
export const isViewingViable = (siqs: number | { score: number; isViable: boolean; } | { siqs: number; isViable: boolean; } | null | undefined): boolean => {
  if (siqs === null || siqs === undefined) {
    return false;
  }
  
  if (typeof siqs === 'number') {
    return siqs >= 5; // Default threshold
  }
  
  return siqs.isViable;
};

/**
 * Get quality level text based on SIQS score
 * @param score - SIQS score value
 * @returns string describing quality
 */
export const getQualityLevelText = (score: number): string => {
  if (score < 3) return 'Poor';
  if (score < 5) return 'Fair';
  if (score < 7) return 'Good';
  if (score < 9) return 'Very Good';
  return 'Excellent';
};
