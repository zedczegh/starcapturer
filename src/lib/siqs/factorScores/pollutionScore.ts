
/**
 * Light pollution and air quality score calculations
 */

/**
 * Calculate the light pollution factor score based on Bortle scale
 * @param bortleScale Bortle scale (1-9, 1 = darkest, 9 = brightest)
 * @returns Score on a 0-100 scale
 */
export function calculateLightPollutionScore(bortleScale: number): number {
  // Validate input
  if (typeof bortleScale !== 'number' || isNaN(bortleScale)) {
    console.warn('Invalid Bortle scale value:', bortleScale);
    return 50; // Default to moderate score for invalid input
  }
  
  // Ensure Bortle scale is within 1-9 range
  const validBortle = Math.max(1, Math.min(9, bortleScale));
  
  // Non-linear mapping to represent the greater impact of light pollution
  // Bortle 1 (darkest) = 100, Bortle 9 (brightest) = 0
  return Math.round(110 - (validBortle * validBortle));
}

/**
 * Calculate the air quality factor score based on AQI
 * @param aqi Air Quality Index
 * @returns Score on a 0-100 scale
 */
export function calculateAQIScore(aqi: number): number {
  // Validate input
  if (typeof aqi !== 'number' || isNaN(aqi)) {
    console.warn('Invalid AQI value:', aqi);
    return 75; // Default to moderately good score for invalid input
  }
  
  // AQI scale: 0-50 Good, 51-100 Moderate, 101-150 Unhealthy for Sensitive Groups,
  // 151-200 Unhealthy, 201-300 Very Unhealthy, 301+ Hazardous
  
  if (aqi <= 25) return 100;  // Excellent
  if (aqi <= 50) return 90;   // Very good
  if (aqi <= 75) return 80;   // Good
  if (aqi <= 100) return 70;  // Moderately good
  if (aqi <= 125) return 60;  // Moderate
  if (aqi <= 150) return 50;  // Acceptable
  if (aqi <= 175) return 40;  // Poor
  if (aqi <= 200) return 30;  // Very poor
  if (aqi <= 300) return 20;  // Bad
  
  return 10; // Extremely bad
}
