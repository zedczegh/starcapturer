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
