
/**
 * Description generators for SIQS factors
 */

export function getCloudDescription(cloudCover: number): string {
  if (cloudCover <= 10) return `Clear skies with ${cloudCover}% cloud cover, excellent for imaging`;
  if (cloudCover <= 25) return `Mostly clear with ${cloudCover}% cloud cover, good for imaging`;
  if (cloudCover <= 40) return `Partly cloudy with ${cloudCover}% cloud cover, may affect quality`;
  if (cloudCover <= 50) return `Cloudy with ${cloudCover}% cloud cover, challenging conditions`;
  return `Heavy cloud cover (${cloudCover}%) makes imaging difficult or impossible`;
}

export function getLightPollutionDescription(bortleScale: number): string {
  if (bortleScale <= 3) return `Dark sky (Bortle ${bortleScale}), excellent for deep sky objects`;
  if (bortleScale <= 5) return `Moderate light pollution (Bortle ${bortleScale}), good for most targets`;
  if (bortleScale <= 7) return `Significant light pollution (Bortle ${bortleScale}), limiting for faint objects`;
  return `Heavy light pollution (Bortle ${bortleScale}), challenging for deep sky objects`;
}

export function getSeeingDescription(seeingConditions: number): string {
  if (seeingConditions <= 1) return `Excellent seeing conditions, perfect for planets and fine details`;
  if (seeingConditions <= 2) return `Good seeing conditions, suitable for high magnification`;
  if (seeingConditions <= 3) return `Average seeing conditions, moderate effect on detail`;
  if (seeingConditions <= 4) return `Poor seeing conditions, affecting fine detail visibility`;
  return `Very poor seeing conditions, significant image distortion`;
}

export function getWindDescription(windSpeed: number): string {
  if (windSpeed < 5) return `Very calm conditions (${windSpeed.toFixed(1)} km/h), minimal equipment vibration`;
  if (windSpeed < 10) return `Light breeze (${windSpeed.toFixed(1)} km/h), minor effect on stability`;
  if (windSpeed < 20) return `Moderate wind (${windSpeed.toFixed(1)} km/h), may affect longer exposures`;
  return `Strong wind (${windSpeed.toFixed(1)} km/h), challenging for stable imaging`;
}

export function getHumidityDescription(humidity: number): string {
  if (humidity < 30) return `Low humidity (${humidity.toFixed(0)}%), ideal conditions`;
  if (humidity < 60) return `Moderate humidity (${humidity.toFixed(0)}%), good conditions`;
  if (humidity < 80) return `High humidity (${humidity.toFixed(0)}%), may cause dew formation`;
  return `Very high humidity (${humidity.toFixed(0)}%), likely dew formation, may affect optics`;
}

export function getMoonDescription(moonPhase: number): string {
  if (moonPhase < 0.1 || moonPhase > 0.9) return 'New moon, excellent for deep sky objects';
  if (moonPhase < 0.25 || moonPhase > 0.75) return 'Crescent moon, good for deep sky objects';
  if (moonPhase < 0.4 || moonPhase > 0.6) return 'Quarter moon, moderate impact on deep sky objects';
  return 'Full or near-full moon, significant impact on deep sky objects';
}

export function getAQIDescription(aqi: number): string {
  if (aqi <= 50) return `Good air quality (AQI: ${aqi}), minimal effect on imaging`;
  if (aqi <= 100) return `Moderate air quality (AQI: ${aqi}), slight effect on imaging`;
  if (aqi <= 150) return `Unhealthy air quality (AQI: ${aqi}), may reduce clarity`;
  if (aqi <= 200) return `Poor air quality (AQI: ${aqi}), reducing transparency`;
  return `Very poor air quality (AQI: ${aqi}), significant impact on imaging`;
}
