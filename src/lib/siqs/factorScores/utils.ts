
/**
 * Normalize scores to consistent scale (0-10) for display
 * This ensures consistent display across the app
 */
export function normalizeScore(score: number): number {
  // Handle invalid inputs
  if (score === null || score === undefined || isNaN(score)) return 0;
  
  // If score is already on 0-10 scale, return as is
  if (score >= 0 && score <= 10) return score;
  
  // If score is on 0-100 scale, normalize to 0-10
  if (score > 10 && score <= 100) return score / 10;
  
  // Cap at 10 for any value over 100
  if (score > 100) return 10;
  
  // Handle negative scores
  return 0;
}
