
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
