
// Optimize progress color calculation with a small cache
const progressColorCache: Record<number, string> = {};

/**
 * Get progress color based on score range to match About SIQS page
 * @param score SIQS score (0-10 scale)
 * @returns CSS variable string for the appropriate color
 */
export const getProgressColor = (score: number): string => {
  // Round to nearest 0.1 for caching
  const roundedScore = Math.round(score * 10) / 10;
  
  if (progressColorCache[roundedScore] !== undefined) {
    return progressColorCache[roundedScore];
  }
  
  let result = "var(--red-500)";
  if (score >= 8) result = "var(--green-500)";
  else if (score >= 6) result = "var(--olive-500)";
  else if (score >= 4) result = "var(--yellow-400)";
  else if (score >= 2) result = "var(--orange-400)";
  
  progressColorCache[roundedScore] = result;
  return result;
};
