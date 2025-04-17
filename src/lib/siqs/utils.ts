
import { validateCloudCover } from './utils';
import { calculateNighttimeSIQS, calculateTonightCloudCover } from '@/utils/nighttimeSIQS';
import { calculateAstronomicalNight, formatTime } from '@/utils/astronomy/nightTimeCalculator';

// Export everything from utils.ts
export { validateCloudCover };

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
