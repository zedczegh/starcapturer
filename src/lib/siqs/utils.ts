/**
 * Utility functions for SIQS calculations and display
 */

// Determine if imaging is impossible based on cloud cover
export function isImagingImpossible(cloudCover: number): boolean {
  return typeof cloudCover === 'number' && cloudCover > 50;
}

// Get color for SIQS score (0-10 scale)
export function siqsToColor(score: number): string {
  if (score >= 8) return '#10b981'; // green-500
  if (score >= 6) return '#3b82f6'; // blue-500
  if (score >= 4) return '#eab308'; // yellow-500
  if (score >= 2) return '#f97316'; // orange-500
  return '#ef4444'; // red-500
}

// Get the display level for a SIQS score
export function getSIQSLevel(score: number): string {
  if (score >= 8) return 'Excellent';
  if (score >= 6) return 'Good';
  if (score >= 4) return 'Average';
  if (score >= 2) return 'Poor';
  return 'Bad';
}

// Format SIQS score consistently for display
export function formatSIQSScore(score: number): string {
  // Round to 1 decimal place
  return (Math.round(score * 10) / 10).toFixed(1);
}

// Convert factor scores to a consistent scale (0-10)
export function normalizeFactorScores(factors: any[]): any[] {
  if (!factors || !Array.isArray(factors)) return [];
  
  return factors.map(factor => {
    if (!factor) return factor;
    
    // If score is already on 0-10 scale, keep it as is
    if (factor.score <= 10) return factor;
    
    // Otherwise, normalize from 0-100 to 0-10
    return {
      ...factor,
      score: factor.score / 10
    };
  });
}
