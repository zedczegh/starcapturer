
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
  
  // Improved cloud cover scoring with smoother transitions:
  // 0-20% cloud cover = Outstanding (80-100 points)
  // 20-35% cloud cover = Very Good (65-80 points)
  // 35-50% cloud cover = Good (50-65 points)
  // 50-70% cloud cover = Fair (20-50 points)
  // 70-85% cloud cover = Poor (0-20 points)
  // >85% cloud cover = Very Poor (0 points)
  
  if (cloudCover <= 20) {
    // Outstanding conditions: 0-20% -> 80-100 points
    return 100 - cloudCover;
  } else if (cloudCover <= 35) {
    // Very good conditions: 20-35% -> 65-80 points
    return 80 - ((cloudCover - 20) * 1.0);
  } else if (cloudCover <= 50) {
    // Good conditions: 35-50% -> 50-65 points
    return 65 - ((cloudCover - 35) * 1.0);
  } else if (cloudCover <= 70) {
    // Fair conditions: 50-70% -> 20-50 points
    return 50 - ((cloudCover - 50) * 1.5);
  } else if (cloudCover <= 85) {
    // Poor conditions: 70-85% -> 0-20 points
    return Math.max(0, 20 - ((cloudCover - 70) * 1.33));
  } else {
    // Very Poor conditions: 85-100% -> 0 points
    return 0;
  }
}

export function calculateLightPollutionScore(bortleScale: number): number {
  // Ensure bortleScale is within valid range (1-9)
  const validBortleScale = Math.min(9, Math.max(1, bortleScale || 5));
  
  // Improved light pollution scoring curve
  // Not strictly linear, giving more weight to darker skies
  const percentage = (validBortleScale - 1) / 8;
  
  // Modified exponential function to emphasize darker skies
  return 100 * Math.pow(1 - percentage, 1.2);
}

export function calculateSeeingScore(seeingConditions: number): number {
  // Ensure seeingConditions is within valid range (1-5)
  const validSeeingConditions = Math.min(5, Math.max(1, seeingConditions || 3));
  
  // Improved curve for seeing conditions
  // Inverted scale, 100 is perfect (seeing 1), 0 is terrible (seeing 5)
  const percentage = (validSeeingConditions - 1) / 4;
  return 100 * Math.pow(1 - percentage, 1.3);
}

export function calculateWindScore(windSpeed: number): number {
  // More nuanced wind speed scoring
  // 0-5 km/h: Excellent (100-80)
  // 5-15 km/h: Good (80-60)
  // 15-25 km/h: Fair (60-30)
  // 25-35 km/h: Poor (30-0)
  // >35 km/h: Very poor (0)
  
  if (windSpeed <= 5) {
    return 100 - (windSpeed * 4);
  } else if (windSpeed <= 15) {
    return 80 - ((windSpeed - 5) * 2);
  } else if (windSpeed <= 25) {
    return 60 - ((windSpeed - 15) * 3);
  } else if (windSpeed <= 35) {
    return 30 - ((windSpeed - 25) * 3);
  } else {
    return 0;
  }
}

export function calculateHumidityScore(humidity: number): number {
  // Improved humidity scoring with more realistic impact on observation
  // Low humidity is better for astronomy, but not strictly linear
  // <40%: Excellent
  // 40-60%: Good
  // 60-80%: Fair
  // 80-100%: Poor
  
  if (humidity < 40) {
    return 100 - (humidity * 0.5);
  } else if (humidity < 60) {
    return 80 - ((humidity - 40) * 1.0);
  } else if (humidity < 80) {
    return 60 - ((humidity - 60) * 1.5);
  } else {
    return 30 - ((humidity - 80) * 1.5);
  }
}

export function calculateMoonScore(moonPhase: number): number {
  // Improved moon phase scoring with more accurate astronomical impact
  // 100 is new moon (0), 0 is full moon (0.5), improves again toward new moon (1)
  
  // Convert moon phase to radians for proper sinusoidal calculation
  const phaseInRadians = moonPhase * Math.PI * 2;
  
  // Cosine gives us proper curve with minimum at full moon (0.5)
  // Scale from -1,1 to 0,1 range
  const moonImpact = (Math.cos(phaseInRadians) + 1) / 2;
  
  // Scale to 0-100 range and invert (higher score is better)
  return moonImpact * 100;
}

export function calculateAQIScore(aqi: number): number {
  // Improved AQI scoring with smoother transitions
  // AQI scale: 0-50 (Good), 51-100 (Moderate), 101-150 (Unhealthy for Sensitive Groups), 
  // 151-200 (Unhealthy), 201-300 (Very Unhealthy), 301-500 (Hazardous)
  
  if (aqi <= 25) return 100;
  if (aqi <= 50) return 90 - ((aqi - 25) * 0.4);  // 90-80
  if (aqi <= 100) return 80 - ((aqi - 50) * 0.4); // 80-60
  if (aqi <= 150) return 60 - ((aqi - 100) * 0.4); // 60-40
  if (aqi <= 200) return 40 - ((aqi - 150) * 0.2); // 40-30
  if (aqi <= 300) return 30 - ((aqi - 200) * 0.1); // 30-20
  if (aqi <= 400) return 20 - ((aqi - 300) * 0.05); // 20-15
  return Math.max(0, 15 - ((aqi - 400) * 0.03)); // 15-0
}

/**
 * Calculate clear sky rate score (0-100 scale)
 * @param clearSkyRate Annual clear sky rate percentage
 * @returns Score on 0-100 scale
 */
export function calculateClearSkyScore(clearSkyRate: number): number {
  if (typeof clearSkyRate !== 'number' || isNaN(clearSkyRate)) {
    return 50; // Default to moderate score if no data
  }
  
  // Convert clear sky rate (usually 0-100%) to a 0-100 score
  // Higher clear sky rate = better score
  // We'll use a slightly non-linear curve to emphasize very clear locations
  if (clearSkyRate >= 80) {
    return 100; // Exceptional locations
  } else if (clearSkyRate >= 60) {
    return 80 + ((clearSkyRate - 60) * 1.0); // 80-100 range
  } else if (clearSkyRate >= 40) {
    return 60 + ((clearSkyRate - 40) * 1.0); // 60-80 range
  } else if (clearSkyRate >= 20) {
    return 30 + ((clearSkyRate - 20) * 1.5); // 30-60 range
  } else {
    return Math.max(0, clearSkyRate * 1.5); // 0-30 range
  }
}

/**
 * Normalize scores to consistent scale (0-10) for display
 * This ensures consistent display across the app
 */
export function normalizeScore(score: number): number {
  // Handle invalid inputs
  if (score === null || score === undefined || isNaN(score)) return 0;
  
  // If score is already on 0-10 scale, return as is
  if (score >= 0 && score <= 10) return score;
  
  // If score is on 0-100 scale, normalize to 0-10
  if (score > 10 && score <= 100) return score / 10;
  
  // Cap at 10 for any value over 100
  if (score > 100) return 10;
  
  // Handle negative scores
  return 0;
}
