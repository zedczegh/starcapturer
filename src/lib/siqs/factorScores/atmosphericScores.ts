
/**
 * Atmospheric condition score calculations for SIQS
 */

/**
 * Calculate score based on seeing conditions
 * @param seeing Seeing value (1-5 scale where 1 is best)
 * @returns Score on 0-10 scale
 */
export function calculateSeeingScore(seeing: number): number {
  // Validate input
  const validSeeing = Math.max(1, Math.min(5, seeing));
  
  // Seeing inversely correlates with score (lower seeing = better conditions)
  // 1 = 10, 2 = 8, 3 = 6, 4 = 4, 5 = 2
  return 12 - (2 * validSeeing);
}

/**
 * Calculate score based on wind speed
 * @param windSpeed Wind speed (km/h)
 * @returns Score on 0-10 scale
 */
export function calculateWindScore(windSpeed: number): number {
  // Validate input
  const validWindSpeed = Math.max(0, windSpeed);
  
  // Wind speed inversely correlates with score (lower wind = better conditions)
  // 0-5 km/h = 10-9, 5-10 km/h = 9-7, 10-20 km/h = 7-5, 20-30 km/h = 5-3, 30-40 km/h = 3-1, 40+ km/h = <1
  
  if (validWindSpeed <= 5) {
    return 10 - ((validWindSpeed) * (1 / 5));
  } else if (validWindSpeed <= 10) {
    return 9 - ((validWindSpeed - 5) * (2 / 5));
  } else if (validWindSpeed <= 20) {
    return 7 - ((validWindSpeed - 10) * (2 / 10));
  } else if (validWindSpeed <= 30) {
    return 5 - ((validWindSpeed - 20) * (2 / 10));
  } else if (validWindSpeed <= 40) {
    return 3 - ((validWindSpeed - 30) * (2 / 10));
  } else {
    return Math.max(0, 1 - ((validWindSpeed - 40) * (1 / 10)));
  }
}

/**
 * Calculate score based on humidity
 * @param humidity Humidity percentage (0-100)
 * @returns Score on 0-10 scale
 */
export function calculateHumidityScore(humidity: number): number {
  // Validate input
  const validHumidity = Math.max(0, Math.min(100, humidity));
  
  // Humidity has a sweet spot curve: too low or too high are both bad
  // 0% = 7, 20% = 8, 40-60% = 10, 80% = 7, 100% = 3
  
  if (validHumidity <= 40) {
    // Low humidity: increases from 7 to 10 as humidity increases from 0% to 40%
    return 7 + ((validHumidity) * (3 / 40));
  } else if (validHumidity <= 60) {
    // Ideal range: 40-60% = 10
    return 10;
  } else if (validHumidity <= 80) {
    // Moderate high humidity: decreases from 10 to 7 as humidity increases from 60% to 80%
    return 10 - ((validHumidity - 60) * (3 / 20));
  } else {
    // Very high humidity: decreases from 7 to 3 as humidity increases from 80% to 100%
    return 7 - ((validHumidity - 80) * (4 / 20));
  }
}
