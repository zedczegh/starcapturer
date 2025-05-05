
/**
 * Validate weather data against forecast data for consistency
 */
export function validateWeatherAgainstForecast(weatherData: any, forecastData: any) {
  if (!weatherData || !forecastData?.current) {
    return { isValid: false, correctedData: null };
  }

  const discrepancies = [];
  const correctedData = { ...weatherData };
  let hasChanges = false;

  // Check temperature discrepancy greater than 5°C
  if (
    typeof weatherData.temperature === 'number' && 
    typeof forecastData.current.temperature === 'number' &&
    Math.abs(weatherData.temperature - forecastData.current.temperature) > 5
  ) {
    discrepancies.push({
      field: 'temperature',
      original: weatherData.temperature,
      corrected: forecastData.current.temperature
    });
    correctedData.temperature = forecastData.current.temperature;
    hasChanges = true;
  }

  // Check humidity discrepancy greater than 20%
  if (
    typeof weatherData.humidity === 'number' && 
    typeof forecastData.current.humidity === 'number' &&
    Math.abs(weatherData.humidity - forecastData.current.humidity) > 20
  ) {
    discrepancies.push({
      field: 'humidity',
      original: weatherData.humidity,
      corrected: forecastData.current.humidity
    });
    correctedData.humidity = forecastData.current.humidity;
    hasChanges = true;
  }

  // Check cloud cover discrepancy greater than 30%
  if (
    typeof weatherData.cloudCover === 'number' && 
    typeof forecastData.current.cloudCover === 'number' &&
    Math.abs(weatherData.cloudCover - forecastData.current.cloudCover) > 30
  ) {
    discrepancies.push({
      field: 'cloudCover',
      original: weatherData.cloudCover,
      corrected: forecastData.current.cloudCover
    });
    correctedData.cloudCover = forecastData.current.cloudCover;
    hasChanges = true;
  }

  // Check wind speed discrepancy greater than 10 km/h
  if (
    typeof weatherData.windSpeed === 'number' && 
    typeof forecastData.current.windSpeed === 'number' &&
    Math.abs(weatherData.windSpeed - forecastData.current.windSpeed) > 10
  ) {
    discrepancies.push({
      field: 'windSpeed',
      original: weatherData.windSpeed,
      corrected: forecastData.current.windSpeed
    });
    correctedData.windSpeed = forecastData.current.windSpeed;
    hasChanges = true;
  }

  // Missing fields check
  const criticalFields = ['temperature', 'humidity', 'cloudCover', 'windSpeed'];
  for (const field of criticalFields) {
    if (
      (weatherData[field] === undefined || weatherData[field] === null || isNaN(weatherData[field])) &&
      forecastData.current[field] !== undefined
    ) {
      discrepancies.push({
        field,
        original: weatherData[field],
        corrected: forecastData.current[field]
      });
      correctedData[field] = forecastData.current[field];
      hasChanges = true;
    }
  }

  // Update time if significantly different
  if (weatherData.time && forecastData.current.time) {
    const weatherTime = new Date(weatherData.time).getTime();
    const forecastTime = new Date(forecastData.current.time).getTime();
    const hourDifference = Math.abs(weatherTime - forecastTime) / (1000 * 60 * 60);
    
    if (hourDifference > 1) {
      discrepancies.push({
        field: 'time',
        original: weatherData.time,
        corrected: forecastData.current.time
      });
      correctedData.time = forecastData.current.time;
      hasChanges = true;
    }
  }

  return {
    isValid: !hasChanges,
    correctedData: hasChanges ? correctedData : null,
    discrepancies
  };
}

/**
 * Validate if a data object is valid by checking required fields
 */
export function validateDataObject(data: any, requiredFields: string[]): boolean {
  if (!data || typeof data !== 'object') {
    return false;
  }

  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null) {
      return false;
    }
  }

  return true;
}

/**
 * Clean and validate coordinates
 */
export function validateCoordinateObject(obj: any): { 
  isValid: boolean; 
  latitude?: number; 
  longitude?: number; 
} {
  if (!obj) return { isValid: false };
  
  let latitude: number | undefined;
  let longitude: number | undefined;
  
  // Handle case where coordinates might be nested in a location property
  const source = obj.location && typeof obj.location === 'object' ? obj.location : obj;
  
  // Parse latitude
  if (source.latitude !== undefined) {
    latitude = typeof source.latitude === 'number' 
      ? source.latitude 
      : parseFloat(source.latitude);
  } else if (source.lat !== undefined) {
    latitude = typeof source.lat === 'number' 
      ? source.lat 
      : parseFloat(source.lat);
  }
  
  // Parse longitude
  if (source.longitude !== undefined) {
    longitude = typeof source.longitude === 'number' 
      ? source.longitude 
      : parseFloat(source.longitude);
  } else if (source.lon !== undefined || source.lng !== undefined) {
    longitude = typeof source.lon !== 'undefined' 
      ? (typeof source.lon === 'number' ? source.lon : parseFloat(source.lon))
      : (typeof source.lng === 'number' ? source.lng : parseFloat(source.lng));
  }
  
  // Validate values
  const isValid = 
    typeof latitude === 'number' && 
    typeof longitude === 'number' && 
    !isNaN(latitude) && 
    !isNaN(longitude) && 
    latitude >= -90 && 
    latitude <= 90 && 
    longitude >= -180 && 
    longitude <= 180;
  
  return { isValid, latitude, longitude };
}

/**
 * Validates SIQS data structure and values
 */
export function validateSIQSData(siqsData: any): boolean {
  if (!siqsData || typeof siqsData !== 'object') {
    return false;
  }
  
  // Check if score exists and is a number
  if (typeof siqsData.score !== 'number' || isNaN(siqsData.score)) {
    return false;
  }
  
  // Check if isViable property exists
  if (typeof siqsData.isViable !== 'boolean') {
    return false;
  }
  
  // Check if factors is an array (optional check)
  if (siqsData.factors !== undefined && !Array.isArray(siqsData.factors)) {
    return false;
  }
  
  return true;
}

/**
 * Validates weather data structure and values
 */
export function validateWeatherData(weatherData: any): boolean {
  if (!weatherData || typeof weatherData !== 'object') {
    return false;
  }
  
  // Define required weather fields
  const requiredFields = ['temperature', 'humidity', 'cloudCover', 'windSpeed'];
  let requiredFieldsPresent = true;
  
  for (const field of requiredFields) {
    // Check if field exists and is a number
    if (typeof weatherData[field] !== 'number' || isNaN(weatherData[field])) {
      requiredFieldsPresent = false;
      break;
    }
  }
  
  return requiredFieldsPresent;
}
