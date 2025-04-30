
/**
 * Formats a SIQS score for display
 * @param score - The raw SIQS score or object
 * @returns Formatted string representation of the score
 */
export const formatSiqsScore = (score: number | { score: number; isViable: boolean } | null): string => {
  if (score === null || score === undefined) {
    return 'N/A';
  }
  
  if (typeof score === 'object') {
    return score.score.toFixed(1);
  }
  
  return score.toFixed(1);
};

/**
 * Checks if a SIQS score is greater than a given value
 * @param score - The SIQS score or object to check
 * @param threshold - The threshold to compare against
 * @returns Boolean indicating if the score is greater than the threshold
 */
export const isSiqsGreaterThan = (
  score: number | { score: number; isViable: boolean } | null | undefined,
  threshold: number
): boolean => {
  if (score === null || score === undefined) {
    return false;
  }
  
  if (typeof score === 'object') {
    return score.score > threshold;
  }
  
  return score > threshold;
};

/**
 * Gets the numerical value of a SIQS score
 * @param score - The SIQS score or object
 * @returns Numerical value of the score
 */
export const getSiqsScore = (
  score: number | { score: number; isViable: boolean } | null | undefined
): number => {
  if (score === null || score === undefined) {
    return 0;
  }
  
  if (typeof score === 'object') {
    return score.score;
  }
  
  return score;
};
