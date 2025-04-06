
/**
 * Cloud coverage score calculation for SIQS with improved nighttime weighting
 */

/**
 * Calculate score based on cloud cover percentage
 * @param cloudCover Cloud cover percentage (0-100)
 * @param isNighttime Optional flag to use nighttime-specific scoring
 * @returns Score on 0-10 scale
 */
export function calculateCloudScore(cloudCover: number, isNighttime: boolean = false): number {
  // Validate input
  const validCloudCover = Math.max(0, Math.min(100, cloudCover));
  
  // Enhanced cloud scoring algorithm with non-linear scaling
  // Clear skies score higher, higher cloud coverage scores lower
  
  // Nighttime scoring is slightly more forgiving at moderate cloud levels
  // since moonlight can sometimes penetrate thin clouds
  if (isNighttime) {
    return calculateNighttimeCloudScore(validCloudCover);
  }
  
  // Standard daytime scoring
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
    return Math.max(0, 1.5 - ((validCloudCover - 75) * (1.5 / 25)));
  }
}

/**
 * Calculate nighttime-specific cloud score with different weighting
 * @param cloudCover Cloud cover percentage (0-100)
 * @returns Score on 0-10 scale
 */
function calculateNighttimeCloudScore(cloudCover: number): number {
  // Nighttime scoring is optimized for astrophotography
  // 0-5% = 10 (perfect), 10% = 9, 20% = 7.5, 40% = 5, 60% = 2.5, 100% = 0
  
  if (cloudCover <= 5) {
    return 10; // Perfect conditions
  } else if (cloudCover <= 10) {
    return 10 - ((cloudCover - 5) * (1 / 5));
  } else if (cloudCover <= 20) {
    return 9 - ((cloudCover - 10) * (1.5 / 10));
  } else if (cloudCover <= 40) {
    return 7.5 - ((cloudCover - 20) * (2.5 / 20));
  } else if (cloudCover <= 60) {
    return 5 - ((cloudCover - 40) * (2.5 / 20));
  } else if (cloudCover <= 80) {
    return 2.5 - ((cloudCover - 60) * (1.5 / 20));
  } else {
    return Math.max(0, 1 - ((cloudCover - 80) * (1 / 20)));
  }
}

/**
 * Calculate weighted cloud score for two-phase night periods
 * @param eveningCloudCover Evening cloud cover percentage (6PM-12AM)
 * @param morningCloudCover Morning cloud cover percentage (1AM-8AM)
 * @param eveningWeight Weight to give the evening portion (0-1)
 * @returns Weighted score on 0-10 scale
 */
export function calculateWeightedNightCloudScore(
  eveningCloudCover: number,
  morningCloudCover: number,
  eveningWeight: number = 0.4
): number {
  // Validate input
  const validEveningCover = Math.max(0, Math.min(100, eveningCloudCover));
  const validMorningCover = Math.max(0, Math.min(100, morningCloudCover));
  const validWeight = Math.max(0, Math.min(1, eveningWeight));
  
  // Calculate separate scores
  const eveningScore = calculateNighttimeCloudScore(validEveningCover);
  const morningScore = calculateNighttimeCloudScore(validMorningCover);
  
  // Weight and combine the scores
  return (eveningScore * validWeight) + (morningScore * (1 - validWeight));
}

/**
 * Calculate average cloud cover for multiple time periods
 * @param periods Array of cloud cover percentages 
 * @returns Average cloud cover
 */
export function calculateAverageCloudCover(periods: number[]): number {
  if (!periods.length) return 0;
  
  // Filter out invalid values
  const validPeriods = periods.filter(val => !isNaN(val) && val >= 0 && val <= 100);
  
  if (!validPeriods.length) return 0;
  
  // Calculate average
  const sum = validPeriods.reduce((total, current) => total + current, 0);
  return sum / validPeriods.length;
}
