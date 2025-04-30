
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
 * Alternative name for formatSiqsScore for backward compatibility
 */
export const formatSiqs = formatSiqsScore;

/**
 * More descriptive alias for formatSiqsScore
 */
export const formatSiqsForDisplay = formatSiqsScore;

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
 * Checks if a SIQS score is at least a given value
 * @param score - The SIQS score or object to check
 * @param threshold - The threshold to compare against
 * @returns Boolean indicating if the score is at least the threshold
 */
export const isSiqsAtLeast = (
  score: number | { score: number; isViable: boolean } | null | undefined,
  threshold: number
): boolean => {
  if (score === null || score === undefined) {
    return false;
  }
  
  if (typeof score === 'object') {
    return score.score >= threshold;
  }
  
  return score >= threshold;
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

/**
 * Normalize a SIQS score to ensure it's in the 0-10 range
 * @param score - Score to normalize
 * @returns Normalized score in the 0-10 range
 */
export const normalizeToSiqsScale = (score: number): number => {
  // If score is already in the 0-10 range, return it as is
  if (score >= 0 && score <= 10) {
    return score;
  }
  
  // If score is on a 0-100 scale, normalize to 0-10
  if (score > 10 && score <= 100) {
    return score / 10;
  }
  
  // If score is negative, return 0
  if (score < 0) {
    return 0;
  }
  
  // If score is greater than 100, return 10
  return 10;
};
