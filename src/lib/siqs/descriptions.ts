
/**
 * Description functions for SIQS factors
 */

export function getCloudDescription(cloudCover: number): string {
  if (cloudCover < 10) return "Excellent clear skies, ideal for all types of astrophotography";
  if (cloudCover < 20) return "Very good conditions with minimal cloud interference";
  if (cloudCover < 30) return "Moderate cloud cover, suitable for bright targets";
  if (cloudCover < 40) return "Significant cloud cover, limiting for many targets";
  return "Heavy cloud cover, unsuitable for imaging";
}

export function getLightPollutionDescription(bortleScale: number): string {
  if (bortleScale <= 2) return "Excellent dark sky, Milky Way casts shadows";
  if (bortleScale <= 4) return "Good sky darkness, Milky Way visible with detail";
  if (bortleScale <= 6) return "Moderate light pollution, limited deep-sky visibility";
  if (bortleScale <= 7) return "Significant light pollution, only brighter DSOs visible";
  return "Severe light pollution, limiting to planets and bright stars";
}

export function getSeeingDescription(seeingConditions: number): string {
  if (seeingConditions <= 1.5) return "Excellent atmospheric stability for high-resolution imaging";
  if (seeingConditions <= 2.5) return "Good seeing conditions, suitable for planetary detail";
  if (seeingConditions <= 3.5) return "Average seeing, acceptable for most targets";
  if (seeingConditions <= 4.5) return "Poor seeing conditions, challenging for detailed work";
  return "Very poor seeing, significant image degradation";
}

export function getWindDescription(windSpeed: number): string {
  if (windSpeed < 5) return "Calm conditions, ideal for all imaging setups";
  if (windSpeed < 10) return "Light breeze, good for most equipment";
  if (windSpeed < 15) return "Moderate wind, may impact long exposures";
  if (windSpeed < 20) return "Strong wind, challenging for many setups";
  return "Very strong wind, unsuitable for most equipment";
}

export function getHumidityDescription(humidity: number): string {
  if (humidity < 30) return "Very dry conditions, excellent for optics";
  if (humidity < 50) return "Low humidity, good optical performance";
  if (humidity < 70) return "Moderate humidity, acceptable conditions";
  if (humidity < 85) return "High humidity, potential for dew formation";
  return "Very high humidity, significant dew issues likely";
}

export function getAQIDescription(aqi: number): string {
  if (aqi <= 50) return "Good air quality, excellent for imaging";
  if (aqi <= 100) return "Moderate air quality, good for imaging";
  if (aqi <= 150) return "Unhealthy for sensitive groups, acceptable for imaging";
  if (aqi <= 200) return "Unhealthy air quality, reduced clarity";
  if (aqi <= 300) return "Very unhealthy air quality, significant haze";
  return "Hazardous air quality, imaging not recommended";
}
