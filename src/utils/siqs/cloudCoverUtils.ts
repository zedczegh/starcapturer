
/**
 * Utility functions for cloud cover analysis and SIQS calculation
 */

/**
 * Calculate SIQS score based primarily on cloud cover with proper inverse relationship
 * Higher cloud cover should result in lower scores
 * @param cloudCover Cloud cover percentage (0-100)
 * @returns SIQS score (0-10 scale)
 */
export function calculateSiqsFromCloudCover(cloudCover: number): number {
  if (typeof cloudCover !== 'number' || isNaN(cloudCover)) {
    return 0;
  }
  
  // Ensure proper inverse relationship - cloud cover of 100% should result in score of 0
  if (cloudCover >= 90) return 0; // 90-100% cloud cover is terrible for imaging
  if (cloudCover >= 75) return 1; // 75-90% cloud cover is very poor
  if (cloudCover >= 60) return 2.5; // 60-75% cloud cover is poor
  if (cloudCover >= 45) return 4; // 45-60% cloud cover is below average
  if (cloudCover >= 30) return 5.5; // 30-45% cloud cover is average
  if (cloudCover >= 20) return 7; // 20-30% cloud cover is good
  if (cloudCover >= 10) return 8.5; // 10-20% cloud cover is very good
  
  // 0-10% cloud cover is excellent
  return 10 - (cloudCover * 0.15);
}

/**
 * Calculate SIQS score with emphasis on nighttime cloud cover
 * This function ensures consistent SIQS values based on cloud cover
 * @param nighttimeCloudCover Average nighttime cloud cover
 * @param bortleScale Bortle scale value (light pollution)
 * @returns SIQS score (0-10 scale)
 */
export function calculateNighttimeSiqs(nighttimeCloudCover: number, bortleScale: number = 5): number {
  // Cloud cover has much more weight than Bortle scale in this calculation
  const cloudCoverWeight = 0.80; // Increased from 0.75 to give more weight to cloud cover
  const bortleWeight = 0.20; // Decreased from 0.25
  
  // Calculate cloud cover score (0-10)
  const cloudCoverScore = calculateSiqsFromCloudCover(nighttimeCloudCover);
  
  // Calculate Bortle scale score (0-10)
  // Inverted: Lower Bortle scale (less light pollution) = higher score
  const bortleScore = Math.max(0, 10 - (bortleScale));
  
  // Weighted average
  const weightedScore = (cloudCoverScore * cloudCoverWeight) + (bortleScore * bortleWeight);
  
  // If cloud cover is terrible (>65%), significantly reduce the overall score
  if (nighttimeCloudCover > 65) {
    return Math.min(3, weightedScore); // Cap at 3.0 for high cloud cover
  }
  
  // If cloud cover is high (>45%), reduce the score further
  if (nighttimeCloudCover > 45) {
    return Math.min(5, weightedScore); // Cap at 5.0 for moderately high cloud cover
  }
  
  return Math.min(10, Math.max(0, weightedScore));
}

/**
 * Determine if cloud cover makes imaging impossible
 * @param cloudCover Cloud cover percentage (0-100)
 * @returns Boolean indicating if imaging is impossible
 */
export function isImagingImpossible(cloudCover: number): boolean {
  return cloudCover >= 70; // 70% or higher cloud cover makes imaging very difficult
}

/**
 * Validate cloud cover value
 * @param value Cloud cover value to validate
 * @returns Validated cloud cover value (0-100)
 */
export function validateCloudCover(value: any): number {
  if (typeof value !== 'number' || isNaN(value)) {
    return 50; // Default to 50% if invalid
  }
  return Math.min(100, Math.max(0, value)); // Clamp between 0-100
}

/**
 * Get descriptive text for cloud cover values
 * @param cloudCover Cloud cover percentage (0-100)
 * @returns Description string
 */
export function getCloudCoverDescription(cloudCover: number): string {
  if (cloudCover >= 90) return "Heavy overcast (90-100%), imaging impossible";
  if (cloudCover >= 75) return "Mostly overcast (75-90%), very poor for imaging";
  if (cloudCover >= 60) return "Considerable clouds (60-75%), poor for imaging";
  if (cloudCover >= 45) return "Partly cloudy (45-60%), challenging for imaging";
  if (cloudCover >= 30) return "Scattered clouds (30-45%), fair for imaging";
  if (cloudCover >= 20) return "Mostly clear (20-30%), good for imaging";
  if (cloudCover >= 10) return "Few clouds (10-20%), very good for imaging";
  return "Clear skies (0-10%), excellent for imaging";
}
