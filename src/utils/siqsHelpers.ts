
/**
 * Get the SIQS score as a number from various possible SIQS formats
 * @param siqs SIQS value in various possible formats
 * @returns Numeric SIQS score or 0 if not available
 */
export const getSiqsScore = (siqs: number | { score: number; isViable: boolean } | undefined): number => {
  if (siqs === undefined || siqs === null) return 0;
  if (typeof siqs === 'number') return siqs;
  if (typeof siqs === 'object' && 'score' in siqs) return siqs.score;
  return 0;
};

/**
 * Check if SIQS value is greater than a threshold
 * @param siqs SIQS value
 * @param threshold Threshold to compare against
 * @returns True if SIQS is greater than threshold
 */
export const isSiqsGreaterThan = (
  siqs: number | { score: number; isViable: boolean } | undefined, 
  threshold: number
): boolean => {
  const score = getSiqsScore(siqs);
  return score > threshold;
};

/**
 * Check if SIQS value is at least equal to a threshold
 * @param siqs SIQS value
 * @param threshold Threshold to compare against
 * @returns True if SIQS is greater than or equal to threshold
 */
export const isSiqsAtLeast = (
  siqs: number | { score: number; isViable: boolean } | undefined,
  threshold: number
): boolean => {
  const score = getSiqsScore(siqs);
  return score >= threshold;
};

/**
 * Format a SIQS score for display
 * @param siqs SIQS value to format
 * @returns Formatted SIQS string
 */
export const formatSiqs = (siqs: number | { score: number; isViable: boolean } | undefined): string => {
  const score = getSiqsScore(siqs);
  
  if (score <= 0) return "N/A";
  
  // If score is greater than or equal to 10, it's probably on a 0-100 scale
  if (score >= 10) {
    return (score / 10).toFixed(1);
  }
  
  // Otherwise it's probably already on a 0-10 scale
  return score.toFixed(1);
};

/**
 * Alternative name for formatSiqs - to maintain backward compatibility
 */
export const formatSiqsScore = formatSiqs;

/**
 * Format SIQS for display with enhanced formatting options
 * @param siqs SIQS value to format
 * @returns Formatted SIQS string with additional display options
 */
export const formatSiqsForDisplay = (siqs: number | undefined | null): string => {
  if (siqs === undefined || siqs === null || siqs <= 0) return "N/A";
  
  // If score is greater than or equal to 10, normalize to 0-10 scale
  if (siqs >= 10) {
    return (siqs / 10).toFixed(1);
  }
  
  return siqs.toFixed(1);
};

/**
 * Normalize SIQS values to ensure they are on a 0-10 scale
 * @param siqs SIQS value that might be on various scales
 * @returns Normalized SIQS value on 0-10 scale
 */
export const normalizeToSiqsScale = (siqs: number | undefined | null): number => {
  if (siqs === undefined || siqs === null) return 0;
  
  // If score is greater than 10, assume it's on a 0-100 scale and normalize
  if (siqs > 10) {
    return siqs / 10;
  }
  
  return siqs;
};
