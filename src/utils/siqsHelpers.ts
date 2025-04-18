
/**
 * Utility functions for consistent SIQS score handling across the application
 */

/**
 * Extract a numeric SIQS score from various data formats
 * This ensures consistent score handling throughout the app
 * 
 * @param score The score value in any of several possible formats
 * @returns Numeric SIQS score (0-10)
 */
export function getSiqsScore(score: any): number {
  // Handle undefined/null
  if (score == null) return 0;
  
  // Handle direct numeric value
  if (typeof score === 'number') return score;
  
  // Handle string value that can be parsed as a number
  if (typeof score === 'string') {
    const parsed = parseFloat(score);
    if (!isNaN(parsed)) return parsed;
    return 0;
  }
  
  // Handle object with score property (common format from API)
  if (typeof score === 'object') {
    if (score.score != null && typeof score.score === 'number') {
      return score.score;
    }
    
    // Handle siqsResult format
    if (score.siqs != null && typeof score.siqs === 'number') {
      return score.siqs;
    }
  }
  
  // Default to 0 for any unhandled formats
  return 0;
}

/**
 * Format SIQS score for display with consistent decimal places
 * 
 * @param score Raw SIQS score
 * @returns Formatted string with one decimal place
 */
export function formatSiqsScore(score: number | undefined | null): string {
  if (score == null) return '0.0';
  if (typeof score !== 'number') return '0.0';
  
  // Round to 1 decimal place and format
  return (Math.round(score * 10) / 10).toFixed(1);
}

/**
 * Determine if a SIQS score indicates viable conditions
 * 
 * @param score SIQS score
 * @returns Boolean indicating if conditions are viable
 */
export function isViableSiqsScore(score: number): boolean {
  return score >= 5.0;
}

/**
 * Get descriptive quality level from SIQS score
 * 
 * @param score SIQS score
 * @returns Quality level string
 */
export function getSiqsQualityLevel(score: number): 'excellent' | 'good' | 'average' | 'poor' | 'bad' {
  if (score >= 8) return 'excellent';
  if (score >= 6) return 'good';
  if (score >= 4) return 'average'; 
  if (score >= 2) return 'poor';
  return 'bad';
}

/**
 * Compare if a SIQS score is greater than a threshold
 * Handles various input types by using getSiqsScore internally
 * 
 * @param score SIQS score (can be number, object, etc.)
 * @param threshold Value to compare against
 * @returns boolean indicating if score > threshold
 */
export function isSiqsGreaterThan(score: any, threshold: number): boolean {
  const numericScore = getSiqsScore(score);
  return numericScore > threshold;
}

/**
 * Compare if a SIQS score is at least a threshold value
 * Handles various input types by using getSiqsScore internally
 * 
 * @param score SIQS score (can be number, object, etc.)
 * @param threshold Value to compare against
 * @returns boolean indicating if score >= threshold
 */
export function isSiqsAtLeast(score: any, threshold: number): boolean {
  const numericScore = getSiqsScore(score);
  return numericScore >= threshold;
}
