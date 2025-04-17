
/**
 * SIQS evaluation functions for various weather parameters
 */

/**
 * Evaluate cloud cover and convert to a score (0-10)
 * @param cloudCover Cloud cover percentage (0-100)
 * @returns Score from 0 (completely cloudy) to 10 (clear sky)
 */
export function evaluateCloudCover(cloudCover: number): number {
  // Safety check - ensure value is within expected range
  const cloudCoverValue = Math.max(0, Math.min(100, cloudCover));
  
  // Inverse relationship: 0% clouds = 10 score, 100% clouds = 0 score
  return 10 - (cloudCoverValue / 10);
}

/**
 * Evaluate humidity and convert to a score (0-10)
 * @param humidity Humidity percentage (0-100)
 * @returns Score from 0 (very humid) to 10 (dry)
 */
export function evaluateHumidity(humidity: number): number {
  // Safety check - ensure value is within expected range
  const humidityValue = Math.max(0, Math.min(100, humidity));
  
  // Non-linear relationship:
  // - Very low humidity (0-20%): good but not perfect (8-9)
  // - Moderate humidity (20-60%): good to very good (7-8)
  // - High humidity (60-85%): moderate to poor (3-7)
  // - Very high humidity (85%+): poor (0-3)
  
  if (humidityValue < 20) {
    return 9 - (humidityValue / 20);
  } else if (humidityValue < 60) {
    return 8 - ((humidityValue - 20) / 40);
  } else if (humidityValue < 85) {
    return 7 - ((humidityValue - 60) / 5);
  } else {
    return Math.max(0, 3 - ((humidityValue - 85) / 5));
  }
}

/**
 * Evaluate temperature and convert to a score (0-10)
 * @param temperature Temperature in Celsius
 * @returns Score from 0 (extreme temperatures) to 10 (ideal temperature)
 */
export function evaluateTemperature(temperature: number): number {
  // Optimal temperature range is around 5-15°C
  // Too cold (<-10°C) or too hot (>30°C) results in poor seeing conditions
  
  // For very cold temperatures (below -10°C)
  if (temperature < -10) {
    return Math.max(0, 5 + (temperature + 10) / 2);
  } 
  // For cold to cool temperatures (-10°C to 5°C)
  else if (temperature < 5) {
    return 7 + (temperature + 10) / 15;
  } 
  // For optimal temperatures (5°C to 15°C)
  else if (temperature < 15) {
    return 9 + (15 - temperature) / 15;
  } 
  // For warm temperatures (15°C to 30°C)
  else if (temperature < 30) {
    return 9 - (temperature - 15) / 3;
  } 
  // For hot temperatures (above 30°C)
  else {
    return Math.max(0, 5 - (temperature - 30) / 5);
  }
}

/**
 * Evaluate wind speed and convert to a score (0-10)
 * @param windSpeed Wind speed in km/h
 * @returns Score from 0 (very windy) to 10 (calm)
 */
export function evaluateWindSpeed(windSpeed: number): number {
  // Safety check
  const speed = Math.max(0, windSpeed);
  
  // Calm conditions (0-5 km/h): Excellent (9-10)
  if (speed < 5) {
    return 10 - (speed / 5);
  }
  // Light breeze (5-15 km/h): Very good to good (7-9)
  else if (speed < 15) {
    return 9 - ((speed - 5) / 10) * 2;
  }
  // Moderate breeze (15-30 km/h): Good to fair (4-7)
  else if (speed < 30) {
    return 7 - ((speed - 15) / 15) * 3;
  }
  // Strong breeze (30-50 km/h): Poor (1-4)
  else if (speed < 50) {
    return 4 - ((speed - 30) / 20) * 3;
  }
  // Strong wind (50+ km/h): Very poor (0-1)
  else {
    return Math.max(0, 1 - ((speed - 50) / 50));
  }
}
