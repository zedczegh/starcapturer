
/**
 * SIQS score calculation implementation
 */
import { SiqsResult, WeatherDataWithClearSky, SiqsCalculationOptions, SiqsFactor } from './siqsTypes';

/**
 * Calculate SIQS score for a location
 */
export function calculateSiqsScore(
  bortleScale: number,
  weatherData: WeatherDataWithClearSky,
  options: SiqsCalculationOptions = {}
): SiqsResult {
  // Initialize factors array if needed
  const factors: SiqsFactor[] = [];
  
  // Calculate light pollution factor
  const lightPollutionFactor = calculateLightPollutionFactor(bortleScale);
  if (options.includeFactors) {
    factors.push({
      name: "Light Pollution",
      score: lightPollutionFactor * 10, // Scale to 0-10
      description: `Bortle scale ${bortleScale} affects visibility`,
      value: bortleScale
    });
  }
  
  // Calculate weather factors
  const cloudFactor = calculateCloudFactor(weatherData.clearSky);
  if (options.includeFactors) {
    factors.push({
      name: "Cloud Cover",
      score: cloudFactor * 10, // Scale to 0-10
      description: `${100 - weatherData.clearSky}% cloud cover affects visibility`,
      value: weatherData.clearSky
    });
  }
  
  const humidityFactor = calculateHumidityFactor(weatherData.humidity);
  if (options.includeFactors) {
    factors.push({
      name: "Humidity",
      score: humidityFactor * 10, // Scale to 0-10
      description: `${weatherData.humidity}% humidity affects transparency`,
      value: weatherData.humidity
    });
  }
  
  // Calculate additional factors if data is available
  let airQualityFactor = 1;
  if (weatherData.aqi !== undefined) {
    airQualityFactor = calculateAirQualityFactor(weatherData.aqi);
    if (options.includeFactors) {
      factors.push({
        name: "Air Quality",
        score: airQualityFactor * 10, // Scale to 0-10
        description: `AQI of ${weatherData.aqi} affects transparency`,
        value: weatherData.aqi
      });
    }
  }
  
  // Combine all factors to get final score
  const combinedFactor = lightPollutionFactor * cloudFactor * humidityFactor * airQualityFactor;
  
  // Scale to 0-10 range
  const score = Math.min(10, Math.max(0, combinedFactor * 10));
  
  // Create result object
  const result: SiqsResult = {
    siqs: score,
    score: score, // Also set score for compatibility
    isViable: score >= 5.0 // Threshold for viable observation
  };
  
  // Add factors if requested
  if (options.includeFactors) {
    result.factors = factors;
  }
  
  // Add metadata if requested
  if (options.includeMetadata) {
    result.metadata = {
      timestamp: new Date().toISOString(),
      bortleScale: bortleScale,
      weatherSnapshot: { ...weatherData }
    };
  }
  
  return result;
}

/**
 * Calculate factor for light pollution based on Bortle scale
 * @param bortleScale Bortle scale (1-9)
 * @returns Factor between 0-1
 */
function calculateLightPollutionFactor(bortleScale: number): number {
  // Ensure valid Bortle scale
  const validBortle = Math.min(9, Math.max(1, bortleScale));
  
  // Bortle 1 = best (1.0), Bortle 9 = worst (0.2)
  return 1.0 - ((validBortle - 1) * 0.1);
}

/**
 * Calculate factor for cloud cover
 * @param clearSky Percentage of clear sky (0-100)
 * @returns Factor between 0-1
 */
function calculateCloudFactor(clearSky: number): number {
  // Ensure valid range
  const validClearSky = Math.min(100, Math.max(0, clearSky));
  
  // Linear relationship: 0% clear = 0.0, 100% clear = 1.0
  return validClearSky / 100;
}

/**
 * Calculate factor for humidity
 * @param humidity Percentage of humidity (0-100)
 * @returns Factor between 0-1
 */
function calculateHumidityFactor(humidity: number): number {
  // Ensure valid range
  const validHumidity = Math.min(100, Math.max(0, humidity));
  
  // High humidity reduces visibility
  // 0% = 1.0, 100% = 0.7
  return 1.0 - (validHumidity * 0.003);
}

/**
 * Calculate factor for air quality
 * @param aqi Air Quality Index
 * @returns Factor between 0-1
 */
function calculateAirQualityFactor(aqi: number): number {
  // Ensure valid range
  const validAQI = Math.max(0, aqi);
  
  // AQI scale: 0-50 good, 51-100 moderate, 101-150 unhealthy for sensitive groups, etc.
  if (validAQI <= 50) {
    return 1.0;
  } else if (validAQI <= 100) {
    return 0.9;
  } else if (validAQI <= 150) {
    return 0.75;
  } else if (validAQI <= 200) {
    return 0.6;
  } else {
    return 0.5;
  }
}
