
/**
 * Data validation utilities for ensuring consistency and reliability
 * across different data sources in the application
 */

/**
 * Validates weather data against forecast data for consistency
 * Returns corrected data if inconsistencies are found
 */
export function validateWeatherAgainstForecast(weatherData: any, forecastData: any) {
  if (!weatherData || !forecastData?.current) {
    return { isValid: true }; // Skip validation if either data is missing
  }

  const discrepancies = [];
  let needsCorrection = false;
  const correctedData = { ...weatherData };

  // Check temperature discrepancy
  if (weatherData.temperature && forecastData.current.temperature_2m !== undefined) {
    const tempDiff = Math.abs(weatherData.temperature - forecastData.current.temperature_2m);
    if (tempDiff > 5) { // More than 5 degrees difference
      discrepancies.push(`Temperature discrepancy: ${weatherData.temperature}°C vs ${forecastData.current.temperature_2m}°C`);
      correctedData.temperature = forecastData.current.temperature_2m;
      needsCorrection = true;
    }
  }

  // Check humidity discrepancy
  if (weatherData.humidity && forecastData.current.relative_humidity_2m !== undefined) {
    const humidityDiff = Math.abs(weatherData.humidity - forecastData.current.relative_humidity_2m);
    if (humidityDiff > 15) { // More than 15% difference
      discrepancies.push(`Humidity discrepancy: ${weatherData.humidity}% vs ${forecastData.current.relative_humidity_2m}%`);
      correctedData.humidity = forecastData.current.relative_humidity_2m;
      needsCorrection = true;
    }
  }

  // Check wind speed discrepancy
  if (weatherData.windSpeed && forecastData.current.wind_speed_10m !== undefined) {
    const windDiff = Math.abs(weatherData.windSpeed - forecastData.current.wind_speed_10m);
    if (windDiff > 10) { // More than 10 km/h difference
      discrepancies.push(`Wind speed discrepancy: ${weatherData.windSpeed} km/h vs ${forecastData.current.wind_speed_10m} km/h`);
      correctedData.windSpeed = forecastData.current.wind_speed_10m;
      needsCorrection = true;
    }
  }

  // Check cloud cover discrepancy
  if (weatherData.cloudCover !== undefined && forecastData.current.cloud_cover !== undefined) {
    const cloudDiff = Math.abs(weatherData.cloudCover - forecastData.current.cloud_cover);
    if (cloudDiff > 20) { // More than 20% difference
      discrepancies.push(`Cloud cover discrepancy: ${weatherData.cloudCover}% vs ${forecastData.current.cloud_cover}%`);
      correctedData.cloudCover = forecastData.current.cloud_cover;
      needsCorrection = true;
    }
  }

  return {
    isValid: !needsCorrection,
    correctedData: needsCorrection ? correctedData : null,
    discrepancies: discrepancies.length > 0 ? discrepancies : undefined
  };
}

/**
 * Validates location coordinates to ensure they are within valid ranges
 */
export function validateCoordinates(latitude: number, longitude: number): boolean {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return false;
  }
  
  // Check latitude range (-90 to 90)
  if (latitude < -90 || latitude > 90) {
    return false;
  }
  
  // Check longitude range (-180 to 180)
  if (longitude < -180 || longitude > 180) {
    return false;
  }
  
  // Check for non-finite values
  if (!isFinite(latitude) || !isFinite(longitude)) {
    return false;
  }
  
  return true;
}

/**
 * Validates a timestamp is recent enough to be considered valid
 */
export function validateTimestamp(timestamp: number, maxAgeMinutes: number = 60): boolean {
  if (!timestamp || !isFinite(timestamp)) {
    return false;
  }
  
  const now = Date.now();
  const ageInMs = now - timestamp;
  const maxAgeMs = maxAgeMinutes * 60 * 1000;
  
  return ageInMs <= maxAgeMs;
}

/**
 * Validates that a required data structure has all necessary properties
 */
export function validateRequiredProperties(data: any, requiredProps: string[]): boolean {
  if (!data || typeof data !== 'object') {
    return false;
  }
  
  for (const prop of requiredProps) {
    if (data[prop] === undefined) {
      return false;
    }
  }
  
  return true;
}

/**
 * Validates weather data to ensure it contains necessary properties and has valid values
 */
export function validateWeatherData(data: any): boolean {
  if (!data) return false;
  
  // Check for minimum required weather properties
  const requiredProps = ['temperature', 'humidity', 'cloudCover', 'windSpeed'];
  if (!validateRequiredProperties(data, requiredProps)) {
    return false;
  }
  
  // Check for valid values in key properties
  if (typeof data.temperature !== 'number' || isNaN(data.temperature)) {
    return false;
  }
  
  if (typeof data.humidity !== 'number' || data.humidity < 0 || data.humidity > 100 || isNaN(data.humidity)) {
    return false;
  }
  
  if (typeof data.cloudCover !== 'number' || data.cloudCover < 0 || data.cloudCover > 100 || isNaN(data.cloudCover)) {
    return false;
  }
  
  if (typeof data.windSpeed !== 'number' || data.windSpeed < 0 || isNaN(data.windSpeed)) {
    return false;
  }
  
  return true;
}

/**
 * Validates SIQS data to ensure it has the required structure and values
 */
export function validateSIQSData(data: any): boolean {
  if (!data) return false;
  
  // Check for minimum required SIQS properties
  if (typeof data.score !== 'number' || isNaN(data.score)) {
    return false;
  }
  
  // Check for valid score range (typically 0-10, but could be higher before normalization)
  if (data.score < 0) {
    return false;
  }
  
  // Check if isViable is a boolean type if it exists
  if ('isViable' in data && typeof data.isViable !== 'boolean') {
    return false;
  }
  
  // Check if factors array exists if it's specified
  if ('factors' in data && !Array.isArray(data.factors)) {
    return false;
  }
  
  return true;
}
