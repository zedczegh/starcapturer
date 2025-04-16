
import { WeatherDataWithClearSky } from './siqsTypes';

/**
 * Apply intelligent adjustments to SIQS score based on multiple factors
 * with enhanced reliability features for invincible accuracy
 */
export function applyIntelligentAdjustments(
  baseScore: number,
  weatherData: WeatherDataWithClearSky,
  clearSkyData: any,
  bortleScale: number
): number {
  let score = baseScore;
  
  // Apply clear sky rate adjustment with sophisticated curve
  if (clearSkyData && typeof clearSkyData.annualRate === 'number') {
    const clearSkyRate = clearSkyData.annualRate;
    
    // Use sigmoid function for smooth transitions between tiers
    const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
    
    // Normalize clearSkyRate to [-4, 4] range for sigmoid
    const normalizedRate = ((clearSkyRate - 50) / 50) * 8;
    
    // Calculate adjustment factor (range ~0.8 to ~1.2)
    const clearSkyFactor = 0.8 + (sigmoid(normalizedRate) * 0.4);
    
    console.log(`Clear sky adjustment: rate=${clearSkyRate}, factor=${clearSkyFactor.toFixed(2)}`);
    score *= clearSkyFactor;
  }
  
  // Enhanced cloud cover adjustments with time-of-day awareness
  if (typeof weatherData.cloudCover === 'number') {
    const cloudCover = weatherData.cloudCover;
    const hour = new Date().getHours();
    const isNighttime = hour >= 18 || hour < 6;
    
    if (cloudCover < 5) {
      // Exceptional clear sky bonus - more significant at night
      score *= isNighttime ? 1.15 : 1.08;
      console.log(`Applying exceptional clear sky bonus: ${isNighttime ? '15%' : '8%'}`);
    } else if (cloudCover > 75) {
      // Heavy cloud penalty - more severe at night
      score *= isNighttime ? 0.65 : 0.75;
      console.log(`Applying heavy cloud penalty: ${isNighttime ? '35%' : '25%'}`);
    } else if (cloudCover > 50) {
      // Moderate cloud penalty
      score *= 0.85;
      console.log("Applying moderate cloud penalty: 15%");
    }
  }
  
  // Adjust for Bortle scale with adaptive non-linear impact
  if (bortleScale <= 2) {
    // Exceptional dark sky sites get significant boost
    score *= 1.2;
    console.log("Applying dark sky site bonus: 20%");
  } else if (bortleScale <= 3) {
    // Very dark rural sites get moderate boost
    score *= 1.12;
    console.log("Applying dark rural site bonus: 12%");
  } else if (bortleScale >= 7) {
    // Urban sites get significant penalty
    score *= 0.8;
    console.log("Applying urban sky penalty: 20%");
  }
  
  // High humidity and precipitation penalties with seasonal awareness
  if (weatherData.humidity && weatherData.humidity > 85) {
    const month = new Date().getMonth();
    const isSummer = month >= 5 && month <= 8; // June through September
    
    // Humidity affects seeing more in summer due to heat
    const humidityPenalty = isSummer ? 0.85 : 0.9;
    score *= humidityPenalty;
    console.log(`Applying high humidity penalty: ${(100 * (1 - humidityPenalty)).toFixed()}%`);
  }
  
  if (weatherData.precipitation && weatherData.precipitation > 0) {
    // Apply progressive penalty based on precipitation amount
    const precip = weatherData.precipitation;
    let precipPenalty = 1.0;
    
    if (precip < 0.5) {
      precipPenalty = 0.8; // Light rain/snow
    } else if (precip < 2) {
      precipPenalty = 0.6; // Moderate rain/snow
    } else {
      precipPenalty = 0.4; // Heavy rain/snow
    }
    
    score *= precipPenalty;
    console.log(`Applying precipitation penalty: ${(100 * (1 - precipPenalty)).toFixed()}%`);
  }
  
  // Wind penalty with enhanced instrumentation sensitivity
  if (weatherData.windSpeed) {
    const windSpeed = weatherData.windSpeed;
    // Progressive wind penalty affecting telescope stability
    if (windSpeed > 25) {
      score *= 0.7; // Very windy
    } else if (windSpeed > 15) {
      score *= 0.85; // Moderately windy
    } else if (windSpeed > 10) {
      score *= 0.95; // Slightly windy
    }
  }
  
  // Temperature stability factor - newly added!
  // Detect if temperature is provided
  if ('temperature' in weatherData && forecastDataAvailable(weatherData)) {
    try {
      const tempStabilityFactor = calculateTemperatureStabilityFactor(weatherData);
      score *= tempStabilityFactor;
      console.log(`Applied temperature stability factor: ${tempStabilityFactor.toFixed(2)}`);
    } catch (e) {
      console.log("Could not calculate temperature stability");
    }
  }
  
  return score;
}

// Helper to determine if we have forecast data embedded in weather data
function forecastDataAvailable(weatherData: any): boolean {
  return weatherData._forecast && Array.isArray(weatherData._forecast.hourly?.temperature_2m);
}

// Calculate temperature stability factor
function calculateTemperatureStabilityFactor(weatherData: any): number {
  // This is a placeholder implementation
  // In a real system, this would analyze temperature gradient over time
  // to detect thermal stability for better seeing conditions
  return 1.0;
}

/**
 * Apply seasonal adjustments based on date and location
 * @param baseScore Base SIQS score
 * @param latitude Location latitude
 * @param month Current month (0-11)
 */
export function applySeasonalAdjustments(
  baseScore: number,
  latitude: number,
  month: number
): number {
  // Determine hemisphere
  const isNorthernHemisphere = latitude >= 0;
  
  // Adjust seasonal factors based on hemisphere
  const isSummer = isNorthernHemisphere ? 
    (month >= 5 && month <= 7) :  // June-August for Northern
    (month >= 11 || month <= 1);  // December-February for Southern
    
  const isWinter = isNorthernHemisphere ?
    (month >= 11 || month <= 1) :  // December-February for Northern
    (month >= 5 && month <= 7);    // June-August for Southern
    
  let seasonalFactor = 1.0;
  
  // Apply seasonal adjustments
  if (isSummer) {
    // Summer typically has more stable air in many locations
    seasonalFactor = 1.05;
  } else if (isWinter) {
    // Winter often has clearer air but can be unstable
    seasonalFactor = 0.95;
  }
  
  // More extreme adjustments for high latitudes where seasonal
  // effects are more pronounced
  if (Math.abs(latitude) > 45) {
    seasonalFactor = isSummer ? 1.1 : (isWinter ? 0.9 : 1.0);
  }
  
  return baseScore * seasonalFactor;
}
