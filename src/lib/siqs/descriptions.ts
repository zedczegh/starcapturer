
/**
 * Descriptive text functions for SIQS factors
 */

// Cloud cover description
export function getCloudDescription(cloudCover: number): string {
  if (cloudCover === 0) {
    return `Clear skies with 0% cloud cover, excellent for imaging`;
  }
  if (cloudCover <= 10) {
    return `Clear skies with ${cloudCover}% cloud cover, excellent for imaging`;
  }
  if (cloudCover <= 25) {
    return `Mostly clear with ${cloudCover}% cloud cover, good for imaging`;
  }
  if (cloudCover <= 40) {
    return `Partly cloudy with ${cloudCover}% cloud cover, may affect quality`;
  }
  if (cloudCover <= 60) {
    return `Cloudy with ${cloudCover}% cloud cover, challenging conditions`;
  }
  return `Heavy cloud cover (${cloudCover}%) makes imaging difficult`;
}

// Light pollution description
export function getLightPollutionDescription(bortleScale: number): string {
  const validBortleScale = Math.min(9, Math.max(1, bortleScale));
  
  if (validBortleScale <= 2) {
    return `Very dark skies (Bortle ${validBortleScale}), excellent for deep sky objects`;
  }
  if (validBortleScale <= 4) {
    return `Dark skies (Bortle ${validBortleScale}), good for most objects`;
  }
  if (validBortleScale <= 6) {
    return `Moderate light pollution (Bortle ${validBortleScale}), limits faint objects`;
  }
  if (validBortleScale <= 7) {
    return `Significant light pollution (Bortle ${validBortleScale}), challenging conditions`;
  }
  return `Severe light pollution (Bortle ${validBortleScale}), limited to bright objects`;
}

// Seeing conditions description
export function getSeeingDescription(seeingConditions: number): string {
  const validSeeingConditions = Math.min(5, Math.max(1, seeingConditions));
  
  if (validSeeingConditions === 1) {
    return `Excellent seeing conditions, perfect for planetary detail`;
  }
  if (validSeeingConditions === 2) {
    return `Good seeing conditions, suitable for high magnification`;
  }
  if (validSeeingConditions === 3) {
    return `Average seeing conditions, moderate effect on detail`;
  }
  if (validSeeingConditions === 4) {
    return `Poor seeing conditions, limits fine detail`;
  }
  return `Very poor seeing conditions, significant turbulence`;
}

// Wind speed description
export function getWindDescription(windSpeed: number): string {
  if (windSpeed <= 5) {
    return `Calm conditions (${windSpeed.toFixed(1)} km/h), excellent for imaging`;
  }
  if (windSpeed <= 15) {
    return `Light breeze (${windSpeed.toFixed(1)} km/h), minimal impact on stability`;
  }
  if (windSpeed <= 25) {
    return `Moderate wind (${windSpeed.toFixed(1)} km/h), may affect tracking`;
  }
  if (windSpeed <= 35) {
    return `Strong wind (${windSpeed.toFixed(1)} km/h), challenging for stable imaging`;
  }
  return `Very strong wind (${windSpeed.toFixed(1)} km/h), not recommended for imaging`;
}

// Humidity description
export function getHumidityDescription(humidity: number): string {
  if (humidity < 30) {
    return `Low humidity (${humidity.toFixed(1)}%), excellent conditions`;
  }
  if (humidity < 60) {
    return `Moderate humidity (${humidity.toFixed(1)}%), good conditions`;
  }
  if (humidity < 80) {
    return `High humidity (${humidity.toFixed(1)}%), may cause dew formation`;
  }
  return `Very high humidity (${humidity.toFixed(1)}%), requires dew prevention`;
}

// AQI description
export function getAQIDescription(aqi: number): string {
  if (aqi <= 25) {
    return `Excellent air quality (AQI: ${Math.round(aqi)})`;
  }
  if (aqi <= 50) {
    return `Good air quality (AQI: ${Math.round(aqi)})`;
  }
  if (aqi <= 100) {
    return `Moderate air quality (AQI: ${Math.round(aqi)}), slight effect on visibility`;
  }
  if (aqi <= 150) {
    return `Poor air quality (AQI: ${Math.round(aqi)}), reduced visibility`;
  }
  return `Very poor air quality (AQI: ${Math.round(aqi)}), significantly affects imaging`;
}

// Clear sky rate description
export function getClearSkyDescription(clearSkyRate: number): string {
  if (clearSkyRate >= 80) {
    return `Exceptional clear sky rate (${clearSkyRate}%), ideal for astrophotography`;
  } else if (clearSkyRate >= 60) {
    return `Excellent clear sky rate (${clearSkyRate}%), highly favorable for imaging`;
  } else if (clearSkyRate >= 45) {
    return `Good clear sky rate (${clearSkyRate}%), favorable for astrophotography`;
  } else if (clearSkyRate >= 30) {
    return `Moderate clear sky rate (${clearSkyRate}%), acceptable for imaging`;
  } else if (clearSkyRate >= 15) {
    return `Low clear sky rate (${clearSkyRate}%), limited clear nights for imaging`;
  } else {
    return `Very low clear sky rate (${clearSkyRate}%), challenging for regular imaging`;
  }
}
