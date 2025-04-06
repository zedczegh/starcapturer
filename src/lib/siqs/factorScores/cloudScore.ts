
/**
 * Enhanced cloud cover score calculation for SIQS
 * Takes into account both real-time and forecast data
 */

interface CloudCoverData {
  cloudCover?: number;
  nighttimeCloudCover?: number;
  eveningCloudCover?: number;
  morningCloudCover?: number;
}

/**
 * Calculate score based on cloud cover percentage with improved algorithm
 * @param data Cloud cover data from various sources
 * @returns Score on 0-10 scale
 */
export function calculateCloudScore(data: CloudCoverData | number): number {
  // Handle direct number input for backward compatibility
  if (typeof data === 'number') {
    return calculateBasicCloudScore(data);
  }
  
  // Prioritize nighttime data if available for more accurate assessment
  if (data.nighttimeCloudCover !== undefined) {
    return calculateBasicCloudScore(data.nighttimeCloudCover);
  }
  
  // If we have both evening and morning data, use weighted average favoring evening
  if (data.eveningCloudCover !== undefined && data.morningCloudCover !== undefined) {
    // Weight evening slightly higher (60%) as that's when most imaging starts
    const weightedCloudCover = (data.eveningCloudCover * 0.6) + (data.morningCloudCover * 0.4);
    return calculateBasicCloudScore(weightedCloudCover);
  }
  
  // Fall back to overall cloud cover
  if (data.cloudCover !== undefined) {
    return calculateBasicCloudScore(data.cloudCover);
  }
  
  // Default value if no data available
  return 5;
}

/**
 * Basic cloud cover score calculation
 * @param cloudCover Cloud cover percentage (0-100)
 * @returns Score on 0-10 scale
 */
function calculateBasicCloudScore(cloudCover: number): number {
  // Validate input
  const validCloudCover = Math.max(0, Math.min(100, cloudCover));
  
  // Enhanced non-linear scoring algorithm:
  // 0% = 10, 10% = 9, 25% = 7, 50% = 4, 75% = 2, 100% = 0
  
  if (validCloudCover <= 10) {
    // Excellent conditions (0-10%)
    return 10 - (validCloudCover / 10);
  } else if (validCloudCover <= 25) {
    // Good conditions (10-25%)
    return 9 - ((validCloudCover - 10) * (2 / 15));
  } else if (validCloudCover <= 50) {
    // Moderate conditions (25-50%)
    return 7 - ((validCloudCover - 25) * (3 / 25));
  } else if (validCloudCover <= 75) {
    // Poor conditions (50-75%)
    return 4 - ((validCloudCover - 50) * (2 / 25));
  } else {
    // Very poor conditions (75-100%)
    return 2 - ((validCloudCover - 75) * (2 / 25));
  }
}
