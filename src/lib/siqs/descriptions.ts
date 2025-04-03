
/**
 * Description generators for SIQS factors
 */

export function getCloudDescription(cloudCover: number): string {
  // Ensure we only show one decimal place for cloud cover percentage
  const formattedCloudCover = cloudCover.toFixed(1);
  
  if (cloudCover <= 10) return `Clear skies with ${formattedCloudCover}% cloud cover, excellent for imaging`;
  if (cloudCover <= 25) return `Mostly clear with ${formattedCloudCover}% cloud cover, good for imaging`;
  if (cloudCover <= 40) return `Partly cloudy with ${formattedCloudCover}% cloud cover, may affect quality`;
  if (cloudCover <= 50) return `Cloudy with ${formattedCloudCover}% cloud cover, challenging conditions`;
  return `Heavy cloud cover (${formattedCloudCover}%) makes imaging difficult`;
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
  if (seeingConditions <= 3) return `Average seeing conditions, moderate effect on details`;
  if (seeingConditions <= 4) return `Poor seeing conditions, affects image sharpness`;
  return `Very poor seeing conditions, significantly degrades image quality`;
}

export function getWindDescription(windSpeed: number): string {
  if (windSpeed < 5) return `Calm conditions (${windSpeed.toFixed(1)} km/h), ideal for imaging`;
  if (windSpeed < 15) return `Light breeze (${windSpeed.toFixed(1)} km/h), minimal impact on imaging`;
  if (windSpeed < 25) return `Moderate wind (${windSpeed.toFixed(1)} km/h), may affect telescope stability`;
  if (windSpeed < 35) return `Strong wind (${windSpeed.toFixed(1)} km/h), impacts stability`;
  return `High winds (${windSpeed.toFixed(1)} km/h), makes imaging difficult`;
}

export function getHumidityDescription(humidity: number): string {
  if (humidity < 30) return `Low humidity (${humidity.toFixed(1)}%), provides optimal viewing conditions`;
  if (humidity < 60) return `Moderate humidity (${humidity.toFixed(1)}%), may affect equipment`;
  if (humidity < 80) return `High humidity (${humidity.toFixed(1)}%), increases risk of dew formation`;
  return `Very high humidity (${humidity.toFixed(1)}%), requires dew prevention measures`;
}

export function getAQIDescription(aqi: number): string {
  if (aqi < 30) return `Excellent air quality (AQI: ${Math.round(aqi)})`;
  if (aqi < 60) return `Good air quality (AQI: ${Math.round(aqi)})`;
  if (aqi < 90) return `Moderate air quality (AQI: ${Math.round(aqi)})`;
  if (aqi < 120) return `Poor air quality (AQI: ${Math.round(aqi)}), affects visibility`;
  return `Very poor air quality (AQI: ${Math.round(aqi)}), significantly reduces transparency`;
}
