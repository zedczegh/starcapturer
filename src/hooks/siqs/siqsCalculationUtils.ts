
/**
 * Format SIQS score for consistent display across the application
 * @param score SIQS score to format
 * @returns Formatted SIQS score as string with one decimal place
 */
export function formatSIQSScoreForDisplay(score: number | undefined | null): string {
  if (score === undefined || score === null || isNaN(score)) {
    return '0.0';
  }
  
  // Ensure score is between 0 and 10
  const validScore = Math.max(0, Math.min(10, score));
  
  // Format with one decimal place
  return validScore.toFixed(1);
}

/**
 * Get CSS color class based on SIQS score
 * @param score SIQS score
 * @returns Tailwind CSS class for appropriate color
 */
export function getSIQSColorClass(score: number | undefined | null): string {
  if (score === undefined || score === null || isNaN(score)) {
    return 'bg-red-500/80 border-red-400/50';
  }
  
  if (score >= 8) return 'bg-green-500/80 border-green-400/50';
  if (score >= 6) return 'bg-lime-500/80 border-lime-400/50';
  if (score >= 4) return 'bg-yellow-500/80 border-yellow-400/50';
  if (score >= 2) return 'bg-orange-500/80 border-orange-400/50';
  return 'bg-red-500/80 border-red-400/50';
}

/**
 * Get the appropriate text color for SIQS score
 * @param score SIQS score
 * @returns Tailwind CSS text color class
 */
export function getSIQSTextColorClass(score: number | undefined | null): string {
  if (score === undefined || score === null || isNaN(score)) {
    return 'text-red-400';
  }
  
  if (score >= 8) return 'text-green-400';
  if (score >= 6) return 'text-lime-400';
  if (score >= 4) return 'text-yellow-400';
  if (score >= 2) return 'text-orange-400';
  return 'text-red-400';
}

/**
 * Check if SIQS score indicates viable conditions for astrophotography
 * @param score SIQS score
 * @param threshold Minimum viable score (default: 5.0)
 * @returns Boolean indicating if conditions are viable
 */
export function isSIQSViable(score: number | undefined | null, threshold = 5.0): boolean {
  if (score === undefined || score === null || isNaN(score)) {
    return false;
  }
  
  return score >= threshold;
}
