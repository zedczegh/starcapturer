
/**
 * Utility functions for SIQS calculations
 */

import { SIQSFactors } from "./types";

/**
 * Check if imaging conditions are impossible
 * @param factors Weather and location factors
 * @returns True if conditions make imaging impossible
 */
export function isImagingImpossible(factors: SIQSFactors): boolean {
  const { cloudCover, precipitation, weatherCondition } = factors;
  
  // Cloud cover over 95% makes imaging impossible
  if (cloudCover >= 95) return true;
  
  // Heavy precipitation makes imaging impossible
  if (precipitation > 5) return true;
  
  // Certain weather conditions make imaging impossible
  const impossibleConditions = [
    "Thunderstorm", "Heavy rain", "Blizzard", 
    "Heavy snow", "Fog", "Freezing fog"
  ];
  
  if (typeof weatherCondition === 'string' && 
      impossibleConditions.some(cond => weatherCondition.includes(cond))) {
    return true;
  }
  
  return false;
}

/**
 * Convert SIQS score to color string
 * @param siqs SIQS score (0-10)
 * @returns HEX color string
 */
export function siqsToColor(siqs: number): string {
  // Ensure SIQS is on 0-10 scale
  const normalizedSiqs = siqs > 10 ? siqs / 10 : siqs;
  
  if (normalizedSiqs >= 8) return "#22c55e"; // green-500
  if (normalizedSiqs >= 6) return "#3b82f6"; // blue-500
  if (normalizedSiqs >= 5) return "#808000"; // olive green
  if (normalizedSiqs >= 4) return "#eab308"; // yellow-500
  if (normalizedSiqs >= 2) return "#f97316"; // orange-500
  return "#ef4444"; // red-500
}

/**
 * Format SIQS score for display
 * @param score SIQS score
 * @returns Formatted score with 1 decimal place
 */
export function formatSIQSScore(score: number): string {
  return score.toFixed(1);
}

/**
 * Get the quality level text based on SIQS score
 * @param score SIQS score
 * @returns Quality level text
 */
export function getSIQSLevel(score: number): string {
  if (score >= 8) return "Excellent";
  if (score >= 6) return "Good";
  if (score >= 5) return "Above Average";
  if (score >= 4) return "Average";
  if (score >= 2) return "Poor";
  return "Bad";
}

/**
 * Validate and normalize cloud cover percentage
 * @param cloudCover Cloud cover percentage
 * @returns Validated cloud cover percentage
 */
export function validateCloudCover(cloudCover: number): number {
  if (typeof cloudCover !== 'number' || isNaN(cloudCover)) {
    return 50; // Default to 50% if invalid
  }
  
  // Ensure cloud cover is within 0-100 range
  return Math.max(0, Math.min(100, cloudCover));
}

/**
 * Normalize factor scores to 0-10 scale for consistent display
 * @param factors Array of factors with scores
 * @returns Array of factors with normalized scores
 */
export function normalizeFactorScores(factors: Array<{ name: string; score: number; description: string }>): Array<{ name: string; score: number; description: string }> {
  if (!factors || !Array.isArray(factors)) return [];
  
  return factors.map(factor => {
    // If score is already on 0-10 scale, keep it as is
    if (factor.score >= 0 && factor.score <= 10) {
      return factor;
    }
    
    // If score is on 0-100 scale, normalize to 0-10
    if (factor.score > 10 && factor.score <= 100) {
      // For cloud cover, we need special handling
      if (factor.name === "Cloud Cover" || factor.name === "云层覆盖") {
        const cloudCoverPercentage = parseFloat(factor.description.match(/(\d+\.?\d*)%/)?.[1] || "0");
        
        // For high cloud cover, ensure score is appropriately low
        if (cloudCoverPercentage > 70) {
          return {
            ...factor,
            score: Math.min(factor.score / 10, 3) // Cap at 3 for high cloud cover
          };
        } else if (cloudCoverPercentage > 50) {
          return {
            ...factor,
            score: Math.min(factor.score / 10, 5) // Cap at 5 for moderate cloud cover
          };
        }
      }
      
      // Normal normalization for non-cloud cover factors
      return {
        ...factor,
        score: factor.score / 10
      };
    }
    
    // Handle negative scores
    return {
      ...factor,
      score: 0
    };
  });
}
