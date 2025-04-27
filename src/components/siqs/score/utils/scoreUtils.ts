
/**
 * Score utils for coloring and formatting SIQS scores
 */

/**
 * Get appropriate color class for a SIQS score
 * @param score The SIQS score
 * @returns CSS color class
 */
export function getScoreColor(score: number | null): string {
  if (score === null || score <= 0) return 'bg-cosmic-700/50 text-muted-foreground border-cosmic-600/30';
  
  // Ensure score is between 0-10
  const normalizedScore = score > 10 ? score / 10 : score;
  
  if (normalizedScore >= 8) return 'bg-green-500/20 text-green-300 border-green-500/40';
  if (normalizedScore >= 6) return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
  if (normalizedScore >= 4) return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
  if (normalizedScore >= 2) return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
  return 'bg-red-500/20 text-red-300 border-red-500/40';
}

/**
 * Get text color class for a score
 */
export function getScoreTextColor(score: number | null): string {
  if (score === null || score <= 0) return 'text-muted-foreground';
  
  // Ensure score is between 0-10
  const normalizedScore = score > 10 ? score / 10 : score;
  
  if (normalizedScore >= 8) return 'text-green-500';
  if (normalizedScore >= 6) return 'text-blue-500';
  if (normalizedScore >= 4) return 'text-yellow-500';
  if (normalizedScore >= 2) return 'text-orange-500';
  return 'text-red-500';
}
