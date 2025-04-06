
/**
 * Calculate seeing score for SIQS (0-100 scale)
 * @param seeingConditions Seeing conditions (1-5), 1 is best
 * @returns Score on 0-100 scale
 */
export function calculateSeeingScore(seeingConditions: number): number {
  // Ensure seeingConditions is within valid range (1-5)
  const validSeeingConditions = Math.min(5, Math.max(1, seeingConditions || 3));
  
  // More refined curve for seeing conditions based on astronomical research
  // Inverted scale, 100 is perfect (seeing 1), 0 is terrible (seeing 5)
  const percentage = (validSeeingConditions - 1) / 4;
  
  // Updated power function that better reflects the impact of atmospheric seeing
  return 100 * Math.pow(1 - percentage, 1.4);
}

/**
 * Calculate wind score for SIQS (0-100 scale)
 * @param windSpeed Wind speed in km/h
 * @returns Score on 0-100 scale
 */
export function calculateWindScore(windSpeed: number): number {
  // Astronomically calibrated wind speed scoring
  // 0-5 km/h: Excellent (100-80) - Perfect for astrophotography
  // 5-12 km/h: Good (80-60) - Minor impact on long exposures
  // 12-20 km/h: Fair (60-40) - Some impact on stability
  // 20-30 km/h: Poor (40-10) - Significant impact
  // >30 km/h: Very poor (10-0) - Nearly impossible for good imaging
  
  if (windSpeed <= 5) {
    return 100 - (windSpeed * 4);
  } else if (windSpeed <= 12) {
    return 80 - ((windSpeed - 5) * 2.85);
  } else if (windSpeed <= 20) {
    return 60 - ((windSpeed - 12) * 2.5);
  } else if (windSpeed <= 30) {
    return 40 - ((windSpeed - 20) * 3);
  } else {
    return Math.max(0, 10 - ((windSpeed - 30) * 0.5));
  }
}

/**
 * Calculate humidity score for SIQS (0-100 scale)
 * @param humidity Relative humidity percentage (0-100)
 * @returns Score on 0-100 scale
 */
export function calculateHumidityScore(humidity: number): number {
  // Improved humidity scoring based on optical effects research
  // Low humidity is better for astronomy, but the relationship is non-linear
  // <25%: Excellent - very clear viewing
  // 25-45%: Very Good
  // 45-60%: Good
  // 60-75%: Fair
  // 75-90%: Poor
  // >90%: Very poor - high risk of dew and optical issues
  
  if (humidity < 25) {
    return 100 - (humidity * 0.4); // 100-90
  } else if (humidity < 45) {
    return 90 - ((humidity - 25) * 0.75); // 90-75
  } else if (humidity < 60) {
    return 75 - ((humidity - 45) * 1.0); // 75-60
  } else if (humidity < 75) {
    return 60 - ((humidity - 60) * 1.33); // 60-40
  } else if (humidity < 90) {
    return 40 - ((humidity - 75) * 2.0); // 40-10
  } else {
    return Math.max(0, 10 - ((humidity - 90) * 1.0)); // 10-0
  }
}
