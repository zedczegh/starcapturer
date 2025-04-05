
/**
 * Text descriptions for SIQS factors based on values
 */

/**
 * Get a description of cloud cover conditions
 * @param cloudCover Cloud cover percentage
 * @returns Description of cloud cover conditions
 */
export function getCloudDescription(cloudCover: number): string {
  if (cloudCover <= 0) return "Clear skies, perfect for imaging";
  if (cloudCover <= 10) return "Mostly clear skies, excellent for imaging";
  if (cloudCover <= 20) return "Few clouds, very good for imaging";
  if (cloudCover <= 30) return "Partially cloudy, good for imaging";
  if (cloudCover <= 40) return "Scattered clouds, acceptable for imaging";
  if (cloudCover <= 60) return "Partly cloudy, may affect imaging quality";
  if (cloudCover <= 80) return "Mostly cloudy, poor for imaging";
  return "Heavy cloud cover, not suitable for imaging";
}

/**
 * Get a description of light pollution conditions based on Bortle scale
 * @param bortleScale Bortle scale value (1-9)
 * @returns Description of light pollution conditions
 */
export function getLightPollutionDescription(bortleScale: number): string {
  if (bortleScale <= 1) return "Excellent dark sky, no light pollution";
  if (bortleScale <= 2) return "Truly dark sky, minimal light pollution";
  if (bortleScale <= 3) return "Rural sky, low light pollution";
  if (bortleScale <= 4) return "Rural/suburban transition, moderate light pollution";
  if (bortleScale <= 5) return "Suburban sky, notable light pollution";
  if (bortleScale <= 6) return "Bright suburban sky, significant light pollution";
  if (bortleScale <= 7) return "Suburban/urban transition, high light pollution";
  if (bortleScale <= 8) return "City sky, very high light pollution";
  return "Inner city sky, extreme light pollution";
}

/**
 * Get a description of seeing conditions
 * @param seeingConditions Seeing conditions value (1-5)
 * @returns Description of seeing conditions
 */
export function getSeeingDescription(seeingConditions: number): string {
  if (seeingConditions <= 1) return "Excellent seeing conditions, perfect for imaging";
  if (seeingConditions <= 2) return "Very good seeing conditions, great for imaging";
  if (seeingConditions <= 3) return "Good seeing conditions, suitable for imaging";
  if (seeingConditions <= 4) return "Fair seeing conditions, acceptable for imaging";
  return "Poor seeing conditions, may affect imaging quality";
}

/**
 * Get a description of wind conditions
 * @param windSpeed Wind speed in km/h
 * @returns Description of wind conditions
 */
export function getWindDescription(windSpeed: number): string {
  if (windSpeed <= 5) return "Calm conditions, perfect for imaging";
  if (windSpeed <= 10) return "Light breeze, very good for imaging";
  if (windSpeed <= 15) return "Gentle breeze, good for imaging";
  if (windSpeed <= 20) return "Moderate breeze, may affect longer exposures";
  if (windSpeed <= 30) return "Fresh breeze, challenging for imaging";
  return "Strong winds, difficult for imaging";
}

/**
 * Get a description of humidity conditions
 * @param humidity Humidity percentage
 * @returns Description of humidity conditions
 */
export function getHumidityDescription(humidity: number): string {
  if (humidity <= 30) return "Very dry conditions, excellent for imaging";
  if (humidity <= 50) return "Low humidity, very good for imaging";
  if (humidity <= 65) return "Moderate humidity, good for imaging";
  if (humidity <= 80) return "High humidity, may affect imaging quality";
  return "Very humid conditions, risk of dew or condensation";
}

/**
 * Get a description of moon phase conditions
 * @param moonPhase Moon phase (0-1, 0 = new moon, 1 = full moon)
 * @returns Description of moon phase conditions
 */
export function getMoonPhaseDescription(moonPhase: number): string {
  if (moonPhase <= 0.05) return "New moon, excellent for deep sky imaging";
  if (moonPhase <= 0.25) return "Crescent moon, very good for deep sky imaging";
  if (moonPhase <= 0.5) return "Quarter moon, good for general imaging";
  if (moonPhase <= 0.75) return "Gibbous moon, better for lunar/planetary imaging";
  return "Full or near-full moon, best for lunar imaging";
}

/**
 * Get a description of air quality conditions
 * @param aqi Air Quality Index
 * @returns Description of air quality conditions
 */
export function getAQIDescription(aqi: number): string {
  if (aqi <= 30) return "Excellent air quality, perfect for imaging";
  if (aqi <= 50) return "Good air quality, very suitable for imaging";
  if (aqi <= 100) return "Moderate air quality, acceptable for imaging";
  if (aqi <= 150) return "Poor air quality, may affect imaging clarity";
  return "Very poor air quality, significant impact on imaging";
}

/**
 * Get a description of clear sky conditions
 * @param clearSkyRate Clear sky percentage
 * @returns Description of clear sky conditions
 */
export function getClearSkyDescription(clearSkyRate: number): string {
  if (clearSkyRate >= 90) return "Exceptional clear sky rate, perfect for imaging";
  if (clearSkyRate >= 75) return "Very high clear sky rate, excellent for planning";
  if (clearSkyRate >= 60) return "Good clear sky rate, favorable for imaging";
  if (clearSkyRate >= 45) return "Moderate clear sky rate, plan sessions carefully";
  if (clearSkyRate >= 30) return "Low clear sky rate, limited imaging opportunities";
  return "Very low clear sky rate, challenging location for imaging";
}
