
/**
 * Helper functions for working with SIQS (Sky Imaging Quality Score) data
 */

/**
 * Extract numeric SIQS score from various possible data formats
 * @param score The SIQS score in various formats (number, string, object)
 * @returns Numeric SIQS score, or 0 if invalid
 */
export function getSiqsScore(score: number | string | { score: number; isViable: boolean } | any): number {
  // Handle undefined or null
  if (score === undefined || score === null) {
    return 0;
  }
  
  // Handle direct numeric value
  if (typeof score === 'number') {
    return score;
  }
  
  // Handle string value (parse to number)
  if (typeof score === 'string') {
    const parsed = parseFloat(score);
    return isNaN(parsed) ? 0 : parsed;
  }
  
  // Handle object with score property
  if (typeof score === 'object') {
    // SiqsResult object format
    if (score.siqs !== undefined && typeof score.siqs === 'number') {
      return score.siqs;
    }
    
    // Simple score object format
    if (score.score !== undefined && typeof score.score === 'number') {
      return score.score;
    }
  }
  
  // Default to 0 for invalid formats
  return 0;
}

/**
 * Get a human-readable description of the SIQS score
 * @param score SIQS score (0-10)
 * @returns Description string
 */
export function getSiqsDescription(score: number | string | any): string {
  const numericScore = getSiqsScore(score);
  
  if (numericScore >= 8) return 'Excellent';
  if (numericScore >= 6.5) return 'Very Good';
  if (numericScore >= 5) return 'Good';
  if (numericScore >= 3.5) return 'Fair';
  if (numericScore > 0) return 'Poor';
  return 'Unknown';
}

/**
 * Get the CSS color class based on SIQS score
 * @param score SIQS score (0-10)
 * @returns CSS class string
 */
export function getSiqsColorClass(score: number | string | any): string {
  const numericScore = getSiqsScore(score);
  
  if (numericScore >= 8) return 'text-green-400';
  if (numericScore >= 6.5) return 'text-lime-400';
  if (numericScore >= 5) return 'text-yellow-300';
  if (numericScore >= 3.5) return 'text-orange-300';
  return 'text-red-300';
}
