
/**
 * Factor score calculation functions for SIQS
 */

// Individual score calculation functions (0-100 scale)
export function calculateCloudScore(cloudCover: number): number {
  // If cloud cover is above 50%, score should be very low
  if (cloudCover > 50) return 0;
  
  // Otherwise, linear scale from 0-50%
  // 0% cloud cover should be 100 points
  // 50% cloud cover should be 0 points
  return Math.max(0, 100 - (cloudCover * 2));
}

export function calculateLightPollutionScore(bortleScale: number): number {
  // Inverted scale, 100 is dark (bortle 1), 0 is bright (bortle 9)
  return Math.max(0, 100 - ((bortleScale - 1) / 8) * 100);
}

export function calculateSeeingScore(seeingConditions: number): number {
  // Inverted scale, 100 is perfect (seeing 1), 0 is terrible (seeing 5)
  return Math.max(0, 100 - ((seeingConditions - 1) / 4) * 100);
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
