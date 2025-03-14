
/**
 * Convert SIQS score to a color code
 * @param score SIQS score from 0-10
 * @param isViable Whether the conditions are viable for astrophotography
 * @returns CSS color string
 */
export function siqsToColor(score: number, isViable: boolean): string {
  if (!isViable) return 'rgb(239, 68, 68)'; // red-500
  if (score >= 8) return 'rgb(34, 197, 94)'; // green-500
  if (score >= 6) return 'rgb(138, 154, 91)'; // brownish green
  if (score >= 4) return 'rgb(250, 204, 21)'; // yellow-500
  if (score >= 2) return 'rgb(249, 115, 22)'; // orange-500
  return 'rgb(239, 68, 68)'; // red-500
}

/**
 * Check if weather conditions make imaging impossible
 * @param cloudCover Cloud cover percentage
 * @param precipitation Precipitation amount
 * @param weatherCondition Weather condition string
 * @returns True if conditions make imaging impossible
 */
export function isImagingImpossible(
  cloudCover: number, 
  precipitation?: number, 
  weatherCondition?: string, 
  aqi?: number
): boolean {
  // Per user requirement: if average cloud coverage is over 40%, SIQS should be 0
  if (cloudCover > 40) return true;
  
  // Check for precipitation (rain, snow)
  if (precipitation && precipitation > 0.1) return true;
  
  // Check weather conditions (rain, snow, haze, etc.)
  if (weatherCondition) {
    const badConditions = ['rain', 'drizzle', 'snow', 'sleet', 'hail', 'thunderstorm', 'fog', 'haze', 'mist'];
    for (const condition of badConditions) {
      if (weatherCondition.toLowerCase().includes(condition)) return true;
    }
  }
  
  // Very poor air quality makes imaging impossible
  if (aqi && aqi > 300) return true;
  
  return false;
}
