/**
 * Factor score calculation functions for SIQS
 */

// Individual score calculation functions (0-100 scale)
export function calculateCloudScore(cloudCover: number): number {
  // If cloud cover is above 40%, score should be 0
  if (cloudCover > 40) return 0;
  
  // Otherwise, linear scale from 0-40%
  return 100 - (cloudCover * 2.5);
}

export function calculateLightPollutionScore(bortleScale: number): number {
  // Inverted scale, 100 is dark (bortle 1), 0 is bright (bortle 9)
  return 100 - ((bortleScale - 1) / 8) * 100;
}

export function calculateSeeingScore(seeingConditions: number): number {
  // Inverted scale, 100 is perfect (seeing 1), 0 is terrible (seeing 5)
  return 100 - ((seeingConditions - 1) / 4) * 100;
}

export function calculateWindScore(windSpeed: number): number {
  // 100 is calm (0 mph), decreases as wind speed increases
  return Math.max(0, 100 - (windSpeed / 30) * 100); // Assuming 30mph is the limit
}

export function calculateHumidityScore(humidity: number): number {
  // 100 is dry (0% humidity), decreases as humidity increases
  return 100 - humidity;
}

export function calculateMoonScore(moonPhase: number): number {
  // 100 is new moon (0), decreases as moon gets fuller (0.5), back to 100 at new moon (1)
  const moonIllumination = Math.abs(moonPhase - 0.5) * 2; // Scale to 0-1
  return 100 - (moonIllumination * 100);
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
