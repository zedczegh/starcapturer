
/**
 * Get color for progress indicator based on score
 * @param score Value between 0-10
 * @returns Hex color string
 */
export const getProgressColor = (score: number): string => {
  // Fix NaN and out-of-range values
  if (isNaN(score) || score === undefined || score === null) {
    return '#ef4444'; // Red for invalid scores
  }
  
  // Normalize score to ensure it's in 0-10 range
  const normalizedScore = Math.max(0, Math.min(10, score));
  
  // Enhanced color scale with improved precision
  if (normalizedScore >= 8.5) return '#15803d'; // Dark green for excellent
  if (normalizedScore >= 7.5) return '#22c55e'; // Green for very good
  if (normalizedScore >= 6.0) return '#4ade80'; // Light green for good
  if (normalizedScore >= 5.0) return '#f59e0b'; // Amber for acceptable
  if (normalizedScore >= 3.5) return '#f97316'; // Orange for poor
  if (normalizedScore >= 2.0) return '#fb7185'; // Light red for very poor
  return '#ef4444'; // Red for terrible
}

/**
 * Get Tailwind color class for progress bar background
 * @param score Value between 0-10
 * @returns Tailwind CSS class string
 */
export const getProgressColorClass = (score: number): string => {
  // Fix NaN and out-of-range values
  if (isNaN(score) || score === undefined || score === null) {
    return 'bg-red-500';
  }
  
  // Normalize score to ensure it's in 0-10 range
  const normalizedScore = Math.max(0, Math.min(10, score));
  
  // Tailwind color classes for different score ranges
  if (normalizedScore >= 8.5) return 'bg-green-700';
  if (normalizedScore >= 7.5) return 'bg-green-500';
  if (normalizedScore >= 6.0) return 'bg-green-400';
  if (normalizedScore >= 5.0) return 'bg-amber-500';
  if (normalizedScore >= 3.5) return 'bg-orange-500';
  if (normalizedScore >= 2.0) return 'bg-red-400';
  return 'bg-red-500';
}

/**
 * Get Tailwind text color class for score display
 * @param score Value between 0-10
 * @returns Tailwind CSS class string
 */
export const getProgressTextColorClass = (score: number): string => {
  // Fix NaN and out-of-range values
  if (isNaN(score) || score === undefined || score === null) {
    return 'text-red-500';
  }
  
  // Normalize score to ensure it's in 0-10 range
  const normalizedScore = Math.max(0, Math.min(10, score));
  
  // Text color classes for different score ranges
  if (normalizedScore >= 8.5) return 'text-green-700';
  if (normalizedScore >= 7.5) return 'text-green-500';
  if (normalizedScore >= 6.0) return 'text-green-400';
  if (normalizedScore >= 5.0) return 'text-amber-500';
  if (normalizedScore >= 3.5) return 'text-orange-500';
  if (normalizedScore >= 2.0) return 'text-red-400';
  return 'text-red-500';
}

/**
 * Get background color class for score display
 * @param score SIQS score (0-10)
 * @returns Tailwind CSS class for background
 */
export const getScoreBackgroundClass = (score: number): string => {
  if (score >= 7.5) return 'bg-green-500';
  if (score >= 5.0) return 'bg-amber-500';
  if (score >= 2.5) return 'bg-orange-500';
  return 'bg-red-500';
}

/**
 * Get text color class for score display
 * @param score SIQS score (0-10)
 * @returns Tailwind CSS class for text
 */
export const getScoreTextClass = (score: number): string => {
  if (score >= 7.5) return 'text-green-500';
  if (score >= 5.0) return 'text-amber-500';
  if (score >= 2.5) return 'text-orange-500';
  return 'text-red-500';
}
