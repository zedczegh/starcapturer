
/**
 * Calculate cloud score for SIQS (0-100 scale)
 * @param cloudCover Cloud cover percentage (0-100)
 * @returns Score on 0-100 scale
 */
export function calculateCloudScore(cloudCover: number): number {
  // Ensure cloud cover is a valid number
  if (typeof cloudCover !== 'number' || isNaN(cloudCover)) {
    return 0;
  }
  
  // If cloud cover is 0%, score should be 100 points (perfect)
  if (cloudCover === 0) {
    return 100;
  }
  
  // Enhanced cloud cover scoring with smoother transitions and more accurate thresholds
  // Based on astronomical observation research data
  if (cloudCover <= 10) {
    // Excellent conditions: 0-10% -> 90-100 points
    return 100 - cloudCover;
  } else if (cloudCover <= 20) {
    // Very good conditions: 10-20% -> 80-90 points
    return 90 - ((cloudCover - 10) * 1.0);
  } else if (cloudCover <= 35) {
    // Good conditions: 20-35% -> 65-80 points
    return 80 - ((cloudCover - 20) * 1.0);
  } else if (cloudCover <= 50) {
    // Fair conditions: 35-50% -> 45-65 points
    return 65 - ((cloudCover - 35) * 1.33);
  } else if (cloudCover <= 70) {
    // Poor conditions: 50-70% -> 15-45 points
    return 45 - ((cloudCover - 50) * 1.5);
  } else if (cloudCover <= 85) {
    // Very poor conditions: 70-85% -> 0-15 points
    return Math.max(0, 15 - ((cloudCover - 70) * 1.0));
  } else {
    // Terrible conditions: 85-100% -> 0 points
    return 0;
  }
}
