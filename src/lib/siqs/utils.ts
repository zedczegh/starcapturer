
import { normalizeScore } from "./factors";

/**
 * Utility functions for SIQS calculations and display
 */

/**
 * Validates if cloud cover data is within valid range and returns a default value if invalid
 * @param cloudCover Cloud cover percentage
 * @returns Validated cloud cover percentage
 */
export function validateCloudCover(cloudCover: any): number {
  if (typeof cloudCover !== 'number' || isNaN(cloudCover)) {
    return 50; // Default to moderate cloud cover
  }
  
  return Math.max(0, Math.min(100, cloudCover));
}

/**
 * Determines if imaging conditions make astrophotography impossible
 * @param factors Weather/location factors
 * @returns Boolean indicating if imaging is impossible
 */
export function isImagingImpossible(factors: any): boolean {
  // Check for extreme conditions that make imaging impossible
  const cloudCover = validateCloudCover(factors.cloudCover);
  const precipitation = factors.precipitation || 0;
  
  // Imaging is impossible if:
  // - Cloud cover is extremely high (>95%)
  // - Active precipitation is substantial (>1mm)
  return cloudCover > 95 || precipitation > 1;
}

/**
 * Converts SIQS value to color indicator
 * @param value SIQS value (0-10)
 * @returns CSS color code
 */
export function siqsToColor(value: number): string {
  if (value >= 8) return '#22c55e'; // green-500
  if (value >= 6) return '#3b82f6'; // blue-500
  if (value >= 5) return '#84cc16'; // lime-500
  if (value >= 4) return '#eab308'; // yellow-500
  if (value >= 2) return '#f97316'; // orange-500
  return '#ef4444'; // red-500
}

/**
 * Gets the quality level text for a SIQS score
 * @param value SIQS value (0-10)
 * @returns Quality level text
 */
export function getSIQSLevel(value: number): string {
  if (value >= 8) return 'Excellent';
  if (value >= 6) return 'Good';
  if (value >= 4) return 'Average';
  if (value >= 2) return 'Poor';
  return 'Bad';
}

/**
 * Format SIQS score with consistent decimal places
 * @param score SIQS score
 * @returns Formatted score string
 */
export function formatSIQSScore(score: number): string {
  if (typeof score !== 'number' || isNaN(score)) {
    return '0.0';
  }
  
  return score.toFixed(1);
}

/**
 * Normalize factor scores to ensure they're all on 0-10 scale
 * @param factors Array of SIQS factors
 * @returns Normalized factors
 */
export function normalizeFactorScores(factors: any[]): any[] {
  if (!Array.isArray(factors)) return [];
  
  return factors.map(factor => {
    if (!factor) return factor;
    
    // Clone the factor to avoid modifying the original
    const normalizedFactor = { ...factor };
    
    // Convert score to 0-10 scale if needed
    if (typeof normalizedFactor.score === 'number') {
      normalizedFactor.score = normalizeScore(normalizedFactor.score);
    }
    
    return normalizedFactor;
  });
}
