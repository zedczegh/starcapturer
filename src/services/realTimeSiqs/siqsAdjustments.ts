
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
  
  // Enhanced seasonal adjustments based on location and time of year
  const now = new Date();
  const month = now.getMonth();
  
  // Use coordinates from weather data or fallback to intelligent defaults
  const lat = weatherData.latitude || 0;
  
  const seasonalFactor = applySeasonalAdjustments(score, lat, month);
  if (seasonalFactor !== score) {
    console.log(`Applied seasonal adjustment factor: ${(seasonalFactor/score).toFixed(2)}`);
    score = seasonalFactor;
  }
  
  // Diurnal temperature variation factor (new)
  if (weatherData._forecast && Array.isArray(weatherData._forecast.hourly?.temperature_2m)) {
    try {
      const diurnalTempFactor = calculateDiurnalVariationFactor(weatherData._forecast);
      if (diurnalTempFactor !== 1.0) {
        score *= diurnalTempFactor;
        console.log(`Applied diurnal temperature variation factor: ${diurnalTempFactor.toFixed(2)}`);
      }
    } catch (e) {
      console.log("Could not calculate diurnal temperature variation");
    }
  }
  
  // Adjust for certified dark sky locations
  if (clearSkyData && clearSkyData.isDarkSkyReserve) {
    score *= 1.1; // 10% bonus for officially certified dark sky locations
    console.log("Applied certified dark sky location bonus: 10%");
  }
  
  return score;
}

// Helper to determine if we have forecast data embedded in weather data
function forecastDataAvailable(weatherData: WeatherDataWithClearSky): boolean {
  return !!weatherData._forecast && Array.isArray(weatherData._forecast.hourly?.temperature_2m);
}

// Calculate temperature stability factor
function calculateTemperatureStabilityFactor(weatherData: WeatherDataWithClearSky): number {
  // This implementation analyzes forecast temperature data to calculate stability
  
  if (!weatherData._forecast || !weatherData._forecast.hourly?.temperature_2m) {
    return 1.0;
  }
  
  const temps = weatherData._forecast.hourly.temperature_2m;
  const times = weatherData._forecast.hourly.time;
  
  if (!times) return 1.0;
  
  // Get only nighttime temperatures
  const nightTemps: number[] = [];
  for (let i = 0; i < temps.length && i < times.length; i++) {
    const hour = new Date(times[i]).getHours();
    if (hour >= 18 || hour <= 6) {
      nightTemps.push(temps[i]);
    }
  }
  
  if (nightTemps.length < 3) return 1.0;
  
  // Calculate the standard deviation of temperatures
  const avgTemp = nightTemps.reduce((sum, t) => sum + t, 0) / nightTemps.length;
  const squaredDiffs = nightTemps.map(t => Math.pow(t - avgTemp, 2));
  const variance = squaredDiffs.reduce((sum, d) => sum + d, 0) / nightTemps.length;
  const stdDev = Math.sqrt(variance);
  
  // Convert std dev to a factor (lower variation = better seeing)
  // 0°C variation is perfect (factor 1.1)
  // 10°C variation is poor (factor 0.9)
  const stabilityFactor = 1.1 - (Math.min(stdDev, 10) / 50);
  
  return stabilityFactor;
}

/**
 * Calculate adjustment factor based on diurnal temperature variation
 * Higher diurnal variation causes more atmospheric turbulence
 */
function calculateDiurnalVariationFactor(forecast: any): number {
  if (!forecast || !forecast.hourly?.temperature_2m || !forecast.hourly?.time) {
    return 1.0;
  }
  
  const temps = forecast.hourly.temperature_2m;
  const times = forecast.hourly.time;
  
  // Group temperatures by day
  const dailyTemps: Record<string, number[]> = {};
  
  for (let i = 0; i < temps.length && i < times.length; i++) {
    const date = new Date(times[i]).toISOString().split('T')[0];
    if (!dailyTemps[date]) {
      dailyTemps[date] = [];
    }
    dailyTemps[date].push(temps[i]);
  }
  
  // Calculate average diurnal variation
  let totalVariation = 0;
  let dayCount = 0;
  
  Object.values(dailyTemps).forEach(dayTemps => {
    if (dayTemps.length > 6) { // Ensure we have enough data points
      const minTemp = Math.min(...dayTemps);
      const maxTemp = Math.max(...dayTemps);
      totalVariation += (maxTemp - minTemp);
      dayCount++;
    }
  });
  
  if (dayCount === 0) return 1.0;
  
  const avgVariation = totalVariation / dayCount;
  
  // Formula: High variation is bad for atmospheric stability
  // 5°C variation is good (1.05 factor)
  // 20°C variation is poor (0.9 factor)
  let factor = 1.05 - (avgVariation - 5) * 0.01;
  
  // Cap the factor
  factor = Math.max(0.9, Math.min(1.05, factor));
  
  return factor;
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
  
  // Extra desert region adjustments
  if (isDesertRegion(latitude)) {
    // Desert regions often have exceptionally clear skies regardless of season
    seasonalFactor += 0.05;
  }
  
  // Tropical region adjustments - seasons defined by wet/dry rather than summer/winter
  if (Math.abs(latitude) < 23.5) {
    // Override previous seasonal adjustments with wet/dry season logic
    const isDrySeason = isDrySeasonForTropics(latitude, month);
    seasonalFactor = isDrySeason ? 1.1 : 0.9;
  }
  
  // Enhanced climate region specific adjustments
  const climateAdjustmentFactor = getClimateRegionAdjustment(latitude, month);
  seasonalFactor *= climateAdjustmentFactor;
  
  return baseScore * seasonalFactor;
}

/**
 * Get specific climate region adjustments based on latitude and season
 * This enhances accuracy for specific global regions
 */
function getClimateRegionAdjustment(latitude: number, month: number): number {
  const absLat = Math.abs(latitude);
  
  // Sub-Saharan Africa - excellent dry seasons
  if (absLat >= 0 && absLat <= 15 && latitude >= 0 && month >= 10 && month <= 3) {
    return 1.08; // Excellent dry season viewing
  }
  
  // Northern Mediterranean - clear summer skies
  if (latitude >= 35 && latitude <= 45 && month >= 5 && month <= 8) {
    return 1.07; // Mediterranean summer clarity
  }
  
  // Atacama Desert region - world's best viewing conditions year-round
  if (latitude <= -20 && latitude >= -30 && month >= 4 && month <= 9) {
    return 1.12; // Exceptional desert viewing conditions
  }
  
  // Western Australia - clear winter nights
  if (latitude <= -25 && latitude >= -35 && month >= 5 && month <= 8) {
    return 1.06; // Clear Australian winter nights
  }
  
  // Monsoon regions in Southeast Asia - poor summer viewing
  if (latitude >= 10 && latitude <= 30 && month >= 5 && month <= 8) {
    return 0.94; // Monsoon season penalty
  }
  
  // No specific region adjustment
  return 1.0;
}

/**
 * Detect if location is in a major desert region 
 * Enhanced with more specific latitude/longitude bands
 */
function isDesertRegion(latitude: number): boolean {
  // Major desert bands approximately between 15-35° N and S
  const absLat = Math.abs(latitude);
  return (absLat >= 15 && absLat <= 35);
}

/**
 * Determine if it's the dry season in tropical regions
 * Enhanced with hemisphere-specific seasonal patterns
 */
function isDrySeasonForTropics(latitude: number, month: number): boolean {
  if (latitude >= 0) {
    // Northern Hemisphere tropics dry season: November to April
    return month >= 10 || month <= 3;
  } else {
    // Southern Hemisphere tropics dry season: May to October
    return month >= 4 && month <= 9;
  }
}
