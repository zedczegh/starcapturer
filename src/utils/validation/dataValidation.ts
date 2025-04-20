
/**
 * Validates SIQS data structure to ensure it's consistent
 * @param siqsData The SIQS data object to validate
 * @returns Boolean indicating if the data is valid
 */
export const validateSIQSData = (siqsData: any): boolean => {
  // Allow null SIQS data - component will handle this case
  if (siqsData === null || siqsData === undefined) {
    return false;
  }
  
  // Handle case where it's just a number
  if (typeof siqsData === 'number') {
    return true;
  }
  
  // Handle case where it's a simple object with just a score property
  if (typeof siqsData === 'object' && typeof siqsData.score === 'number') {
    return true;
  }
  
  // Handle nested siqsResult case
  if (typeof siqsData === 'object' && siqsData.siqsResult) {
    return validateSIQSData(siqsData.siqsResult);
  }
  
  return false;
};

/**
 * Validates location data structure
 * @param locationData Location data to validate
 * @returns Boolean indicating if the data is valid
 */
export const validateLocationData = (locationData: any): boolean => {
  if (!locationData) return false;
  
  // Basic required fields
  return (
    typeof locationData === 'object' &&
    typeof locationData.latitude === 'number' &&
    typeof locationData.longitude === 'number' &&
    isFinite(locationData.latitude) &&
    isFinite(locationData.longitude)
  );
};

/**
 * Validates weather data structure to ensure it has required fields
 * @param weatherData Weather data to validate
 * @returns Boolean indicating if the data is valid
 */
export const validateWeatherData = (weatherData: any): boolean => {
  if (!weatherData) return false;
  
  return (
    typeof weatherData === 'object' &&
    typeof weatherData.temperature === 'number' &&
    typeof weatherData.humidity === 'number' &&
    typeof weatherData.cloudCover === 'number' &&
    typeof weatherData.windSpeed === 'number' &&
    isFinite(weatherData.temperature) &&
    isFinite(weatherData.humidity) &&
    isFinite(weatherData.cloudCover) &&
    isFinite(weatherData.windSpeed)
  );
};

/**
 * Validates weather data against forecast data for consistency
 * @param weatherData Current weather data
 * @param forecastData Forecast data to validate against
 * @returns Object with validation results and corrected data if needed
 */
export const validateWeatherAgainstForecast = (weatherData: any, forecastData: any): {
  isValid: boolean;
  correctedData?: any;
  discrepancies?: string[];
} => {
  if (!weatherData || !forecastData || !forecastData.current) {
    return { isValid: true }; // Nothing to validate against
  }
  
  const discrepancies: string[] = [];
  let needsCorrection = false;
  
  // Create a copy for potential corrections
  const correctedData = { ...weatherData };
  
  // Check temperature
  if (forecastData.current.temperature && 
      Math.abs(weatherData.temperature - forecastData.current.temperature) > 5) {
    correctedData.temperature = forecastData.current.temperature;
    discrepancies.push('temperature');
    needsCorrection = true;
  }
  
  // Check humidity
  if (forecastData.current.humidity && 
      Math.abs(weatherData.humidity - forecastData.current.humidity) > 15) {
    correctedData.humidity = forecastData.current.humidity;
    discrepancies.push('humidity');
    needsCorrection = true;
  }
  
  // Check cloud cover
  if (forecastData.current.cloudCover && 
      Math.abs(weatherData.cloudCover - forecastData.current.cloudCover) > 20) {
    correctedData.cloudCover = forecastData.current.cloudCover;
    discrepancies.push('cloudCover');
    needsCorrection = true;
  }
  
  // Check wind speed
  if (forecastData.current.windSpeed && 
      Math.abs(weatherData.windSpeed - forecastData.current.windSpeed) > 5) {
    correctedData.windSpeed = forecastData.current.windSpeed;
    discrepancies.push('windSpeed');
    needsCorrection = true;
  }
  
  // Check weather condition
  if (forecastData.current.condition && 
      weatherData.condition !== forecastData.current.condition) {
    correctedData.condition = forecastData.current.condition;
    discrepancies.push('condition');
    needsCorrection = true;
  }
  
  return {
    isValid: !needsCorrection,
    correctedData: needsCorrection ? correctedData : undefined,
    discrepancies: needsCorrection ? discrepancies : undefined
  };
};
