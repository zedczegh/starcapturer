
/**
 * Utility functions for consistent SIQS display across the application
 */

/**
 * Get color based on SIQS score
 * @param score SIQS Score (0-10)
 * @returns Hex color code
 */
export function getSiqsColor(score: number): string {
  // Ensure score is valid
  const validScore = Math.max(0, Math.min(10, Number(score) || 0));
  
  if (validScore >= 8.5) return '#10b981'; // Excellent - emerald green
  if (validScore >= 7.0) return '#34d399'; // Very good - lighter emerald
  if (validScore >= 5.5) return '#0ea5e9'; // Good - blue
  if (validScore >= 4.0) return '#f59e0b'; // Fair - amber
  if (validScore >= 2.5) return '#f97316'; // Poor - orange
  return '#ef4444';                        // Very poor - red
}

/**
 * Format SIQS score for display
 * @param score Raw SIQS score
 * @returns Formatted string with one decimal place
 */
export function formatSiqsScore(score: number | undefined): string {
  if (score === undefined || isNaN(Number(score))) {
    return '0.0';
  }
  
  // Ensure score is valid and within range
  const validScore = Math.max(0, Math.min(10, Number(score)));
  return validScore.toFixed(1);
}

/**
 * Get SIQS class name for styling
 * @param score SIQS Score
 * @returns CSS class name
 */
export function getSiqsClassName(score: number): string {
  // Ensure score is valid
  const validScore = Math.max(0, Math.min(10, Number(score) || 0));
  
  if (validScore >= 7.5) return 'siqs-excellent';
  if (validScore >= 5.5) return 'siqs-good';
  if (validScore >= 3.5) return 'siqs-fair';
  return 'siqs-poor';
}

/**
 * Get SIQS quality text description
 * @param score SIQS Score
 * @param t Translation function (optional)
 * @returns Text description of SIQS quality
 */
export function getSiqsQualityText(score: number, t?: any): string {
  // Ensure score is valid
  const validScore = Math.max(0, Math.min(10, Number(score) || 0));
  
  if (!t) {
    // English fallbacks
    if (validScore >= 8.5) return 'Excellent';
    if (validScore >= 7.0) return 'Very Good';
    if (validScore >= 5.5) return 'Good';
    if (validScore >= 4.0) return 'Fair';
    if (validScore >= 2.5) return 'Poor';
    return 'Very Poor';
  }
  
  // With translations
  if (validScore >= 8.5) return t('Excellent', '优秀');
  if (validScore >= 7.0) return t('Very Good', '很好');
  if (validScore >= 5.5) return t('Good', '好');
  if (validScore >= 4.0) return t('Fair', '一般');
  if (validScore >= 2.5) return t('Poor', '差');
  return t('Very Poor', '很差');
}

/**
 * Get consistent SIQS value from any location object
 * @param location Location object
 * @returns SIQS value (0-10 scale)
 */
export function getConsistentSiqsValue(location: any): number {
  if (!location) return 0;
  
  // Get SIQS from siqsResult if available (most accurate)
  if (location.siqsResult && typeof location.siqsResult.score === 'number') {
    return Math.min(10, Math.max(0, location.siqsResult.score));
  }
  
  // Fall back to direct siqs property
  if (typeof location.siqs === 'number') {
    return Math.min(10, Math.max(0, location.siqs));
  }
  
  // Last resort: estimate from Bortle scale 
  if (typeof location.bortleScale === 'number') {
    return Math.min(10, Math.max(0, (10 - location.bortleScale * 0.75) + 3));
  }
  
  return 0; // Default if no data available
}
