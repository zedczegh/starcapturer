
/**
 * Utility functions to validate weather data and detect suspicious values
 */

/**
 * Checks if weather data contains too many zeros or unlikely values
 * @param weatherData The weather data to check
 * @returns Object containing validation results
 */
export function detectSuspiciousWeatherData(weatherData: any) {
  if (!weatherData) return { isValid: false, issues: ['no-data'] };
  
  const issues: string[] = [];
  let zeroCounter = 0;
  
  // Check for zeros in critical fields
  if (weatherData.temperature === 0) zeroCounter++;
  if (weatherData.humidity === 0) zeroCounter++;
  if (weatherData.cloudCover === 0) zeroCounter++;
  if (weatherData.windSpeed === 0) zeroCounter++;
  
  // If 3 or more critical values are zero, likely bad data
  if (zeroCounter >= 3) {
    issues.push('too-many-zeros');
  }
  
  // Check for unrealistic values
  if (weatherData.temperature < -100 || weatherData.temperature > 60) {
    issues.push('unrealistic-temperature');
  }
  
  if (weatherData.humidity < 0 || weatherData.humidity > 100) {
    issues.push('invalid-humidity');
  }
  
  if (weatherData.cloudCover < 0 || weatherData.cloudCover > 100) {
    issues.push('invalid-cloud-cover');
  }
  
  // Check if data appears to be stale (more than 3 hours old)
  if (weatherData.time) {
    const dataTime = new Date(weatherData.time).getTime();
    const now = new Date().getTime();
    const threeHoursMs = 3 * 60 * 60 * 1000;
    
    if (now - dataTime > threeHoursMs) {
      issues.push('stale-data');
    }
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    zeroCounter
  };
}

/**
 * Returns a user-friendly message for weather data issues
 */
export function getWeatherIssueMessage(issues: string[], language: 'en' | 'zh'): string {
  if (issues.includes('too-many-zeros')) {
    return language === 'en' 
      ? "The weather data appears to be unreliable (too many zero values)" 
      : "天气数据似乎不可靠（太多零值）";
  }
  
  if (issues.includes('unrealistic-temperature')) {
    return language === 'en' 
      ? "The temperature data appears to be unrealistic" 
      : "温度数据似乎不切实际";
  }
  
  if (issues.includes('stale-data')) {
    return language === 'en' 
      ? "The weather data may be stale (over 3 hours old)" 
      : "天气数据可能已过时（超过3小时）";
  }
  
  if (issues.includes('no-data')) {
    return language === 'en' 
      ? "No weather data available" 
      : "没有可用的天气数据";
  }
  
  return language === 'en' 
    ? "There may be issues with the weather data" 
    : "天气数据可能存在问题";
}
