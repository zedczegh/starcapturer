
/**
 * Cloud coverage score calculation for SIQS
 */

/**
 * Calculate score based on cloud cover percentage
 * @param cloudCover Cloud cover percentage (0-100)
 * @returns Score on 0-10 scale
 */
export function calculateCloudScore(cloudCover: number): number {
  // Validate input
  const validCloudCover = Math.max(0, Math.min(100, cloudCover));
  
  // Enhanced cloud scoring algorithm with non-linear scaling
  // Clear skies score higher, higher cloud coverage scores lower
  
  // Score calculation with diminishing returns
  // 0% clouds = 10, 10% = 9, 25% = 7, 50% = 4, 75% = 1.5, 100% = 0
  if (validCloudCover <= 5) {
    return 10;
  } else if (validCloudCover <= 10) {
    return 9;
  } else if (validCloudCover <= 25) {
    return 9 - ((validCloudCover - 10) * (2 / 15));
  } else if (validCloudCover <= 50) {
    return 7 - ((validCloudCover - 25) * (3 / 25));
  } else if (validCloudCover <= 75) {
    return 4 - ((validCloudCover - 50) * (2.5 / 25));
  } else {
    return 1.5 - ((validCloudCover - 75) * (1.5 / 25));
  }
}
