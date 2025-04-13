
/**
 * Format distance in a user-friendly way based on locale
 * @param distance Distance in kilometers
 * @returns Formatted distance string
 */
export const formatDistanceDisplay = (distance: number): string => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)} m`;
  } else if (distance < 10) {
    return `${distance.toFixed(1)} km`;
  } else {
    return `${Math.round(distance)} km`;
  }
};

/**
 * Format SIQS score for display with the appropriate number of decimals
 * @param score SIQS score
 * @returns Formatted SIQS score as string
 */
export const formatSIQSScoreForDisplay = (score: number): string => {
  if (typeof score !== 'number' || isNaN(score)) {
    return '0.0';
  }
  
  // Always display one decimal place for consistency
  return score.toFixed(1);
};
