
/**
 * Factor score calculation functions for SIQS
 */

// Individual score calculation functions (0-100 scale)
export function calculateCloudScore(cloudCover: number): number {
  // Ensure cloud cover is a valid number
  if (typeof cloudCover !== 'number' || isNaN(cloudCover)) {
    return 0;
  }
  
  // If cloud cover is 0%, score should be 100 points (perfect)
  if (cloudCover === 0) {
    return 100;
  }
  
  // Modified cloud cover scoring:
  // 0-20% cloud cover = Outstanding (80-100 points)
  // 20-35% cloud cover = Very Good (65-80 points)
  // 35-50% cloud cover = Good (50-65 points)
  // 50-65% cloud cover = Fair (25-50 points)
  // 65-80% cloud cover = Poor (0-25 points)
  // >80% cloud cover = Very Poor (0-15 points on a more lenient scale)
  
  if (cloudCover <= 20) {
    // Outstanding conditions: 0-20% -> 80-100 points
    return 100 - cloudCover;
  } else if (cloudCover <= 35) {
    // Very good conditions: 20-35% -> 65-80 points
    return 80 - ((cloudCover - 20) * 1.0);
  } else if (cloudCover <= 50) {
    // Good conditions: 35-50% -> 50-65 points
    return 65 - ((cloudCover - 35) * 1.0);
  } else if (cloudCover <= 65) {
    // Fair conditions: 50-65% -> 25-50 points
    return 50 - ((cloudCover - 50) * 1.67);
  } else if (cloudCover <= 80) {
    // Poor conditions: 65-80% -> 0-25 points
    return Math.max(0, 25 - ((cloudCover - 65) * 1.67));
  } else {
    // Very Poor conditions: 80-100% -> 0-15 points (more lenient)
    // This provides a small non-zero score (up to 1.5 on the final 0-10 scale)
    return Math.max(0, 15 * (1 - ((cloudCover - 80) / 20)));
  }
}

export function calculateLightPollutionScore(bortleScale: number): number {
  // Ensure bortleScale is within valid range (1-9)
  const validBortleScale = Math.min(9, Math.max(1, bortleScale || 5));
  
  // Inverted scale, 100 is dark (bortle 1), 0 is bright (bortle 9)
  return Math.max(0, 100 - ((validBortleScale - 1) / 8) * 100);
}

export function calculateSeeingScore(seeingConditions: number): number {
  // Ensure seeingConditions is within valid range (1-5)
  const validSeeingConditions = Math.min(5, Math.max(1, seeingConditions || 3));
  
  // Inverted scale, 100 is perfect (seeing 1), 0 is terrible (seeing 5)
  return Math.max(0, 100 - ((validSeeingConditions - 1) / 4) * 100);
}

export function calculateWindScore(windSpeed: number): number {
  // 100 is calm (0 mph), decreases as wind speed increases
  // Using 30mph as the upper threshold where score becomes 0
  return Math.max(0, 100 - (windSpeed / 30) * 100);
}

export function calculateHumidityScore(humidity: number): number {
  // Lower humidity is better for astronomy
  // 0% humidity = 100 points, 100% humidity = 0 points
  return Math.max(0, 100 - humidity);
}

export function calculateMoonScore(moonPhase: number): number {
  // 100 is new moon (0), 0 is full moon (0.5)
  // This is a more accurate model: new moon (0) is best,
  // full moon (0.5) is worst, then improves again toward new moon (1)
  return Math.max(0, 100 - (Math.sin(moonPhase * Math.PI) * 100));
}

export function calculateAQIScore(aqi: number): number {
  // AQI scale: 0-50 (Good), 51-100 (Moderate), 101-150 (Unhealthy for Sensitive Groups), 
  // 151-200 (Unhealthy), 201-300 (Very Unhealthy), 301-500 (Hazardous)
  if (aqi <= 50) return 100;
  if (aqi <= 100) return 80;
  if (aqi <= 150) return 60;
  if (aqi <= 200) return 40;
  if (aqi <= 300) return 20;
  return 0;
}

/**
 * Normalize scores to consistent scale (0-10) for display
 * This ensures consistent display across the app
 */
export function normalizeScore(score: number): number {
  // If score is already on 0-10 scale, return as is
  if (score >= 0 && score <= 10) return score;
  
  // If score is on 0-100 scale, normalize to 0-10
  if (score > 10 && score <= 100) return score / 10;
  
  // Cap at 10 for any value over 100
  if (score > 100) return 10;
  
  // Handle negative scores
  return 0;
}
