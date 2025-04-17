
/**
 * SIQS utility functions
 */

// Import from utils file
// Fix circular reference by not importing validateCloudCover from itself
import { calculateNighttimeSIQS, calculateTonightCloudCover } from '@/utils/nighttimeSIQS';
import { calculateAstronomicalNight, formatTime } from '@/utils/astronomy/nightTimeCalculator';

/**
 * Validate cloud cover percentage
 * @param cloudCover Cloud cover percentage
 * @returns Validated cloud cover (0-100)
 */
export function validateCloudCover(cloudCover: number | undefined): number {
  if (cloudCover === undefined || cloudCover === null) {
    return 0;
  }
  
  // Ensure cloud cover is within valid range
  return Math.max(0, Math.min(100, cloudCover));
}

// Re-export nighttime SIQS functions
export { calculateNighttimeSIQS, calculateTonightCloudCover };

// Re-export astronomical night calculator
export { calculateAstronomicalNight, formatTime };

/**
 * Format a SIQS score for display
 * @param score SIQS score (0-10)
 * @returns Formatted score string
 */
export function formatSIQSScore(score: number): string {
  return score.toFixed(1);
}

/**
 * Get the SIQS quality level based on score
 * @param score SIQS score (0-10)
 * @returns Quality level string
 */
export function getSIQSLevel(score: number): string {
  if (score >= 8.5) return 'Excellent';
  if (score >= 6.5) return 'Good';
  if (score >= 4.5) return 'Average';
  if (score >= 2.5) return 'Poor';
  return 'Very Poor';
}

/**
 * Validate if a SIQS score is viable for imaging
 * @param score SIQS score (0-10)
 * @returns Boolean indicating viability
 */
export function isViableSIQS(score: number): boolean {
  return score >= 5.0; // Consider viable if score is at least 5.0
}

/**
 * Convert SIQS score to color
 * @param score SIQS score (0-10)
 * @returns Color string for display
 */
export function siqsToColor(score: number): string {
  if (score >= 8) return 'green';
  if (score >= 6.5) return 'lime';
  if (score >= 5) return 'yellow';
  if (score >= 3.5) return 'orange';
  return 'red';
}

/**
 * Normalize factor scores to ensure all are on a 0-10 scale
 * @param factors Array of SIQS factors
 * @returns Array with normalized scores
 */
export function normalizeFactorScores(factors: any[]): any[] {
  if (!factors || !Array.isArray(factors)) return [];
  
  return factors.map(factor => {
    if (!factor) return factor;
    
    // Skip factors that are already normalized
    if (factor.score >= 0 && factor.score <= 10) {
      return factor;
    }
    
    // Convert percentage-based scores (0-100) to 0-10 scale
    if (factor.score >= 0 && factor.score <= 100) {
      return {
        ...factor,
        score: factor.score / 10
      };
    }
    
    return factor;
  });
}
