
/**
 * Cloud score calculation for SIQS
 */

/**
 * Calculate the cloud cover factor score
 * @param cloudCover Cloud cover percentage (0-100)
 * @returns Score on a 0-100 scale
 */
export function calculateCloudScore(cloudCover: number): number {
  // Validate input
  if (typeof cloudCover !== 'number' || isNaN(cloudCover)) {
    console.warn('Invalid cloud cover value:', cloudCover);
    return 50; // Default to moderate score for invalid input
  }
  
  // Ensure cloud cover is within 0-100 range
  const validCloudCover = Math.max(0, Math.min(100, cloudCover));
  
  // Special case: 0% cloud cover should be perfect score
  if (validCloudCover === 0) return 100;
  
  // High weight against clouds - decreases faster than linear
  // This reflects how even small amounts of clouds can impact imaging
  const score = Math.max(0, 100 - (validCloudCover * 1.5));
  
  return Math.round(score);
}
