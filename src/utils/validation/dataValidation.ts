
/**
 * Utilities for validating weather and SIQS data consistency
 */

/**
 * Validate weather data to ensure it's complete and has valid values
 * @param data Weather data object
 * @returns Boolean indicating if data is valid
 */
export const validateWeatherData = (data: any): boolean => {
  if (!data) return false;
  
  const isValid = 
    typeof data.temperature === 'number' &&
    typeof data.humidity === 'number' &&
    typeof data.cloudCover === 'number' &&
    typeof data.windSpeed === 'number' &&
    typeof data.precipitation === 'number' &&
    typeof data.time === 'string' &&
    typeof data.condition === 'string';
  
  if (!isValid) {
    console.error("Invalid weather data detected:", data);
    return false;
  }
  
  return true;
};

/**
 * Compare current weather data with forecast data to check for significant discrepancies
 * @param currentData Current weather data
 * @param forecastData Forecast data
 * @returns Object with validation results and corrected data if needed
 */
export const validateWeatherAgainstForecast = (
  currentData: any,
  forecastData: any
): { isValid: boolean; correctedData?: any; discrepancies?: string[] } => {
  if (!currentData || !forecastData || !forecastData.current) {
    return { isValid: true }; // Can't validate without both data points
  }
  
  const current = forecastData.current;
  const discrepancies: string[] = [];
  let needsCorrection = false;
  
  // Clone current data to avoid direct mutations
  const correctedData = { ...currentData };
  
  // Check temperature - allow 3 degree difference
  if (typeof current.temperature_2m === 'number' && 
      Math.abs(current.temperature_2m - currentData.temperature) > 3) {
    discrepancies.push(`Temperature: ${currentData.temperature}°C vs ${current.temperature_2m}°C`);
    correctedData.temperature = current.temperature_2m;
    needsCorrection = true;
  }
  
  // Check humidity - allow 15% difference
  if (typeof current.relative_humidity_2m === 'number' && 
      Math.abs(current.relative_humidity_2m - currentData.humidity) > 15) {
    discrepancies.push(`Humidity: ${currentData.humidity}% vs ${current.relative_humidity_2m}%`);
    correctedData.humidity = current.relative_humidity_2m;
    needsCorrection = true;
  }
  
  // Check cloud cover - allow 20% difference
  if (typeof current.cloud_cover === 'number' && 
      Math.abs(current.cloud_cover - currentData.cloudCover) > 20) {
    discrepancies.push(`Cloud Cover: ${currentData.cloudCover}% vs ${current.cloud_cover}%`);
    correctedData.cloudCover = current.cloud_cover;
    needsCorrection = true;
  }
  
  // Check wind speed - allow 5 km/h difference
  if (typeof current.wind_speed_10m === 'number' && 
      Math.abs(current.wind_speed_10m - currentData.windSpeed) > 5) {
    discrepancies.push(`Wind Speed: ${currentData.windSpeed} km/h vs ${current.wind_speed_10m} km/h`);
    correctedData.windSpeed = current.wind_speed_10m;
    needsCorrection = true;
  }
  
  // Check precipitation
  if (typeof current.precipitation === 'number' && 
      Math.abs(current.precipitation - currentData.precipitation) > 0.5) {
    discrepancies.push(`Precipitation: ${currentData.precipitation} mm vs ${current.precipitation} mm`);
    correctedData.precipitation = current.precipitation;
    needsCorrection = true;
  }
  
  // Map weather codes to conditions if needed
  if (typeof current.weather_code === 'number' && currentData.condition) {
    const forecastCondition = mapWeatherCodeToCondition(current.weather_code);
    if (forecastCondition && forecastCondition !== currentData.condition) {
      discrepancies.push(`Condition: ${currentData.condition} vs ${forecastCondition}`);
      correctedData.condition = forecastCondition;
      correctedData.weatherCondition = forecastCondition;
      needsCorrection = true;
    }
  }
  
  return { 
    isValid: !needsCorrection, 
    correctedData: needsCorrection ? correctedData : undefined,
    discrepancies: discrepancies.length > 0 ? discrepancies : undefined
  };
};

/**
 * Validate SIQS data for completeness
 * @param data SIQS result data
 * @returns Boolean indicating if data is valid
 */
export const validateSIQSData = (data: any): boolean => {
  if (!data) return false;
  
  const isValid = 
    typeof data.score === 'number' &&
    typeof data.isViable === 'boolean' &&
    Array.isArray(data.factors);
  
  if (!isValid) {
    console.error("Invalid SIQS data detected:", data);
    return false;
  }
  
  return true;
};

/**
 * Map Open-Meteo weather codes to human-readable conditions
 * @param code Weather code from Open-Meteo API
 * @returns Human-readable weather condition
 */
export const mapWeatherCodeToCondition = (code: number): string => {
  const weatherConditions: Record<number, string> = {
    0: "Clear sky", 
    1: "Mainly clear", 
    2: "Partly cloudy", 
    3: "Overcast",
    45: "Fog", 
    48: "Depositing rime fog", 
    51: "Light drizzle",
    53: "Moderate drizzle", 
    55: "Dense drizzle", 
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle", 
    61: "Slight rain", 
    63: "Moderate rain",
    65: "Heavy rain", 
    66: "Light freezing rain", 
    67: "Heavy freezing rain",
    71: "Slight snow fall", 
    73: "Moderate snow fall", 
    75: "Heavy snow fall",
    77: "Snow grains", 
    80: "Slight rain showers", 
    81: "Moderate rain showers",
    82: "Violent rain showers", 
    85: "Slight snow showers", 
    86: "Heavy snow showers",
    95: "Thunderstorm", 
    96: "Thunderstorm with slight hail", 
    99: "Thunderstorm with heavy hail"
  };
  
  return weatherConditions[code] || "Unknown";
};
