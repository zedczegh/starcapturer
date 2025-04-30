
/**
 * Helper utilities for SIQS calculations and display
 */

/**
 * Extract SIQS score safely from potentially complex SIQS data
 * @param siqs - SIQS value which could be a number, object with score property, or null
 * @returns numeric SIQS score or 0 if unavailable
 */
export const getSiqsScore = (siqs: number | { score: number; isViable: boolean; } | { siqs: number; isViable: boolean; } | any): number => {
  if (siqs === null || siqs === undefined) {
    return 0;
  }
  
  if (typeof siqs === 'number') {
    return siqs;
  }
  
  if (typeof siqs === 'object') {
    // Handle SharedAstroSpot objects which have siqs property
    if (siqs.siqs !== undefined) {
      // If siqs itself is an object with score
      if (typeof siqs.siqs === 'object' && siqs.siqs !== null && 'score' in siqs.siqs) {
        return siqs.siqs.score;
      }
      return typeof siqs.siqs === 'number' ? siqs.siqs : 0;
    }
    
    // Handle direct objects with score property
    if ('score' in siqs) {
      return siqs.score;
    }
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
  if (score < 7) return 'Good'; // Fixed incorrect threshold
  if (score < 9) return 'Very Good';
  return 'Excellent';
};

/**
 * Format SIQS score for display (1 decimal place)
 * @param score - SIQS score
 * @returns formatted string representation
 */
export const formatSiqsForDisplay = (score: number): string => {
  if (score === undefined || score === null) return '0.0';
  return score.toFixed(1);
};

/**
 * Alternative name for formatSiqsForDisplay (for compatibility)
 */
export const formatSiqsScore = formatSiqsForDisplay;

/**
 * Check if SIQS score is greater than threshold
 * @param siqs - SIQS value in various formats
 * @param threshold - Value to compare against
 * @returns boolean indicating if score exceeds threshold
 */
export const isSiqsGreaterThan = (siqs: number | { score: number; isViable: boolean; } | { siqs: number; isViable: boolean; } | any, threshold: number): boolean => {
  const score = getSiqsScore(siqs);
  return score > threshold;
};

/**
 * Check if SIQS score is at least equal to threshold
 * @param siqs - SIQS value in various formats
 * @param threshold - Value to compare against
 * @returns boolean indicating if score meets or exceeds threshold
 */
export const isSiqsAtLeast = (siqs: number | { score: number; isViable: boolean; } | { siqs: number; isViable: boolean; } | any, threshold: number): boolean => {
  const score = getSiqsScore(siqs);
  return score >= threshold;
};

/**
 * Normalize any value to the SIQS 0-10 scale
 * @param value - Value to normalize
 * @param fromMin - Source minimum (default: 0)
 * @param fromMax - Source maximum (default: 100)
 * @param toMin - Target minimum (default: 0)
 * @param toMax - Target maximum (default: 10)
 * @returns Normalized value on SIQS scale
 */
export const normalizeToSiqsScale = (
  value: number,
  fromMin: number = 0,
  fromMax: number = 100,
  toMin: number = 0,
  toMax: number = 10
): number => {
  // Handle edge cases
  if (value === undefined || value === null) return 0;
  if (fromMax === fromMin) return toMin;
  
  // Clamp value to source range
  const clampedValue = Math.max(fromMin, Math.min(fromMax, value));
  
  // Normalize to target range
  return toMin + ((clampedValue - fromMin) * (toMax - toMin)) / (fromMax - fromMin);
};

