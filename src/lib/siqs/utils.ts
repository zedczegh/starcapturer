/**
 * Utility functions for SIQS (Stellar Imaging Quality Score)
 */

/**
 * Converts a SIQS score (0-10) to a representative color
 * @param score SIQS score between 0 and 10
 * @returns CSS color string
 */
export function siqsToColor(score: number): string {
  if (score >= 8) return "#10B981"; // emerald-500 - Excellent
  if (score >= 6) return "#22D3EE"; // cyan-400 - Very Good
  if (score >= 4) return "#3B82F6"; // blue-500 - Good
  if (score >= 2) return "#F59E0B"; // amber-500 - Moderate
  if (score >= 1) return "#F97316"; // orange-500 - Poor
  return "#EF4444"; // red-500 - Very Poor
}

/**
 * Check if cloud cover is too high for imaging
 * Note: Function kept for compatibility, but no longer enforces a strict cutoff
 * @param cloudCover Cloud cover percentage
 * @returns Boolean indicating if imaging is technically impossible
 */
export function isImagingImpossible(cloudCover: number): boolean {
  // We've removed the strict cutoff, but keep the function to avoid breaking existing code
  // Now returning false to allow the calculation to proceed
  return false;
}

/**
 * Get display text for SIQS level based on score
 * @param score SIQS score between 0 and 10
 * @returns Text representation of SIQS level
 */
export function getSIQSLevel(score: number): string {
  if (score >= 8) return "Excellent";
  if (score >= 6) return "Good";
  if (score >= 4) return "Average";
  if (score >= 2) return "Poor";
  return "Very Poor";
}

/**
 * Format SIQS score for display with proper precision
 * @param score SIQS score to format
 * @returns Formatted score string
 */
export function formatSIQSScore(score: number): string {
  return score.toFixed(1);
}

/**
 * Validate and normalize cloud cover percentage
 * @param cloudCover Raw cloud cover percentage
 * @returns Validated cloud cover (0-100)
 */
export function validateCloudCover(cloudCover: number): number {
  if (typeof cloudCover !== 'number' || isNaN(cloudCover)) {
    return 50; // Default to 50% if invalid
  }
  return Math.max(0, Math.min(100, cloudCover));
}

/**
 * Normalize factor scores to a consistent 0-10 scale for display
 * @param factors Array of factors with scores
 * @returns Array of factors with normalized scores
 */
export function normalizeFactorScores(factors: Array<{ name: string; score: number; description: string }>) {
  if (!factors || !Array.isArray(factors)) return [];
  
  return factors.map(factor => {
    // If score is already on 0-10 scale, return as is
    if (factor.score >= 0 && factor.score <= 10) {
      return factor;
    }
    
    // If score is on 0-100 scale, normalize to 0-10
    let normalizedScore = factor.score;
    if (factor.score > 10 && factor.score <= 100) {
      normalizedScore = factor.score / 10;
    }
    
    // Cap at 10 for any value over 100
    if (factor.score > 100) {
      normalizedScore = 10;
    }
    
    // Handle negative scores
    if (factor.score < 0) {
      normalizedScore = 0;
    }
    
    return {
      ...factor,
      score: normalizedScore
    };
  });
}
