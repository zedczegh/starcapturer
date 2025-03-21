
/**
 * Get progress color based on score range to match About SIQS page
 * @param score SIQS score (0-10 scale)
 * @returns CSS variable string for the appropriate color
 */
export const getProgressColor = (score: number): string => {
  // Store common color values for reuse
  if (score >= 8) return "var(--green-500)";
  if (score >= 6) return "var(--olive-500)";
  if (score >= 4) return "var(--yellow-400)";
  if (score >= 2) return "var(--orange-400)";
  return "var(--red-500)";
};

/**
 * Get progress color as a Tailwind class
 * @param score SIQS score (0-10 scale)
 * @returns Tailwind color class for backgrounds
 */
export const getProgressColorClass = (score: number): string => {
  if (score >= 8) return "bg-green-500";
  if (score >= 6) return "bg-gradient-to-r from-[#8A9A5B] to-[#606C38]";
  if (score >= 4) return "bg-yellow-400";
  if (score >= 2) return "bg-orange-400";
  return "bg-red-500";
};

/**
 * Get progress color as a Tailwind text class
 * @param score SIQS score (0-10 scale)
 * @returns Tailwind color class for text
 */
export const getProgressTextColorClass = (score: number): string => {
  if (score >= 8) return "text-green-500";
  if (score >= 6) return "text-green-700";
  if (score >= 4) return "text-yellow-500";
  if (score >= 2) return "text-orange-500";
  return "text-red-500";
};

/**
 * Get score class name for progress bars
 * These are used to apply the appropriate color styles to SIQS score bars
 * @param score SIQS score (0-100 scale)
 * @returns CSS class name for the score range
 */
export const getScoreClass = (score: number): string => {
  // Convert to 0-10 scale if needed
  const normalizedScore = score > 10 ? score / 10 : score;
  
  if (normalizedScore >= 8) return 'score-excellent';
  if (normalizedScore >= 6) return 'score-good';
  if (normalizedScore >= 4) return 'score-average';
  if (normalizedScore >= 2) return 'score-poor';
  return 'score-bad';
};
