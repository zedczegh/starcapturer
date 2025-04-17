
/**
 * SIQS evaluation functions for different weather factors
 */

/**
 * Evaluate cloud cover impact on SIQS
 * @param cloudCoverPercent - Cloud cover percentage (0-100)
 * @returns Score from 0-10
 */
export function evaluateCloudCover(cloudCoverPercent: number): number {
  // Clouds have a strong negative impact on viewing conditions
  // 0% clouds → 10, 100% clouds → 0
  return 10 - (cloudCoverPercent / 10);
}

/**
 * Evaluate humidity impact on SIQS
 * @param humidityPercent - Humidity percentage (0-100)
 * @returns Score from 0-10
 */
export function evaluateHumidity(humidityPercent: number): number {
  // Humidity affects image quality and equipment
  // Low humidity (0-30%) → 9-10
  // Moderate humidity (30-60%) → 6-9
  // High humidity (60-80%) → 3-6
  // Very high humidity (80-100%) → 0-3
  
  if (humidityPercent <= 30) {
    return 9 + (30 - humidityPercent) / 30;
  } else if (humidityPercent <= 60) {
    return 6 + (60 - humidityPercent) / 10;
  } else if (humidityPercent <= 80) {
    return 3 + (80 - humidityPercent) / 6.67;
  } else {
    return 3 * (100 - humidityPercent) / 20;
  }
}

/**
 * Evaluate temperature impact on SIQS
 * @param temperatureCelsius - Temperature in Celsius
 * @returns Score from 0-10
 */
export function evaluateTemperature(temperatureCelsius: number): number {
  // Temperature affects seeing conditions and equipment performance
  // Ideal range: 5-20°C → 8-10
  // Cold: -20 to 5°C → 5-8
  // Hot: 20-40°C → 4-8
  // Extreme cold/hot: < -20°C or > 40°C → 0-5
  
  if (temperatureCelsius >= 5 && temperatureCelsius <= 20) {
    // Ideal temperature range
    return 8 + 2 * (1 - Math.abs(temperatureCelsius - 12.5) / 15);
  } else if (temperatureCelsius >= -20 && temperatureCelsius < 5) {
    // Cold
    return 5 + 3 * (temperatureCelsius + 20) / 25;
  } else if (temperatureCelsius > 20 && temperatureCelsius <= 40) {
    // Hot
    return 8 - 4 * (temperatureCelsius - 20) / 20;
  } else if (temperatureCelsius < -20) {
    // Extreme cold
    return Math.max(0, 5 + (temperatureCelsius + 40) / 4);
  } else {
    // Extreme hot
    return Math.max(0, 4 - (temperatureCelsius - 40) / 5);
  }
}

/**
 * Evaluate wind speed impact on SIQS
 * @param windSpeedKmh - Wind speed in km/h
 * @returns Score from 0-10
 */
export function evaluateWindSpeed(windSpeedKmh: number): number {
  // Wind affects stability
  // 0-5 km/h → 9-10 (best)
  // 5-15 km/h → 7-9 (good)
  // 15-30 km/h → 4-7 (moderate)
  // 30-50 km/h → 1-4 (poor)
  // >50 km/h → 0-1 (terrible)
  
  if (windSpeedKmh <= 5) {
    return 9 + (5 - windSpeedKmh) / 5;
  } else if (windSpeedKmh <= 15) {
    return 7 + 2 * (15 - windSpeedKmh) / 10;
  } else if (windSpeedKmh <= 30) {
    return 4 + 3 * (30 - windSpeedKmh) / 15;
  } else if (windSpeedKmh <= 50) {
    return 1 + 3 * (50 - windSpeedKmh) / 20;
  } else {
    return Math.max(0, 1 - (windSpeedKmh - 50) / 30);
  }
}
