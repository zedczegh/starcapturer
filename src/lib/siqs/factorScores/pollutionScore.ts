
/**
 * Light pollution and air quality score calculations for SIQS
 */

/**
 * Calculate score based on Bortle scale (light pollution)
 * @param bortleScale Bortle scale value (1-9)
 * @returns Score on 0-10 scale
 */
export function calculateLightPollutionScore(bortleScale: number): number {
  // Validate input
  const validBortle = Math.max(1, Math.min(9, bortleScale));
  
  // Enhanced scoring algorithm with non-linear scaling for better differentiation
  // Bortle 1 = 10, Bortle 3 = 9, Bortle 5 = 7, Bortle 7 = 4, Bortle 9 = 1
  
  if (validBortle <= 1) {
    return 10;
  } else if (validBortle <= 3) {
    return 10 - ((validBortle - 1) * (1 / 2));
  } else if (validBortle <= 5) {
    return 9 - ((validBortle - 3) * (2 / 2));
  } else if (validBortle <= 7) {
    return 7 - ((validBortle - 5) * (3 / 2));
  } else {
    return 4 - ((validBortle - 7) * (3 / 2));
  }
}

/**
 * Calculate score based on Air Quality Index
 * @param aqi Air Quality Index value
 * @returns Score on 0-10 scale
 */
export function calculateAQIScore(aqi: number | undefined): number {
  // If no AQI data available, return neutral score
  if (aqi === undefined || aqi === null) {
    return 7.5;
  }
  
  // Validate input
  const validAQI = Math.max(0, aqi);
  
  // AQI scoring: lower AQI = better score
  // 0-50 (Good) = 10-9
  // 51-100 (Moderate) = 8.9-7
  // 101-150 (Unhealthy for Sensitive Groups) = 6.9-5
  // 151-200 (Unhealthy) = 4.9-3
  // 201-300 (Very Unhealthy) = 2.9-1
  // 301+ (Hazardous) = 0.9-0
  
  if (validAQI <= 50) {
    return 10 - ((validAQI) * (1 / 50));
  } else if (validAQI <= 100) {
    return 9 - ((validAQI - 50) * (2 / 50));
  } else if (validAQI <= 150) {
    return 7 - ((validAQI - 100) * (2 / 50));
  } else if (validAQI <= 200) {
    return 5 - ((validAQI - 150) * (2 / 50));
  } else if (validAQI <= 300) {
    return 3 - ((validAQI - 200) * (2 / 100));
  } else {
    return Math.max(0, 1 - ((validAQI - 300) * (1 / 200)));
  }
}
