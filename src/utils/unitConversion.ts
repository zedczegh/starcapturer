/**
 * Converts and formats temperature for display
 * @param temperature Temperature in Celsius
 * @param language Language code ('en' for Fahrenheit, 'zh' for Celsius)
 * @returns Formatted temperature string with appropriate unit
 */
export const formatTemperature = (temperature: number, language: string = 'en'): string => {
  if (language === 'en') {
    // Convert to Fahrenheit for English
    const fahrenheit = (temperature * 9/5) + 32;
    return `${Math.round(fahrenheit)}°F`;
  } else {
    // Keep Celsius for Chinese
    return `${Math.round(temperature)}°C`;
  }
};

/**
 * Converts and formats wind speed for display
 * @param windSpeed Wind speed in m/s
 * @param language Language code ('en' for mph, 'zh' for km/h)
 * @returns Formatted wind speed string with appropriate unit
 */
export const formatWindSpeed = (windSpeed: number, language: string = 'en'): string => {
  if (language === 'en') {
    // Convert to mph for English
    const mph = windSpeed * 2.237;
    return `${Math.round(mph)} mph`;
  } else {
    // Convert to km/h for Chinese
    const kmh = windSpeed * 3.6;
    return `${Math.round(kmh)} km/h`;
  }
};

/**
 * Converts and formats distance for display
 * @param distance Distance in kilometers
 * @param language Language code ('en' for miles, 'zh' for km)
 * @returns Formatted distance string with appropriate unit
 */
export const formatDistance = (distance: number, language: string = 'en'): string => {
  if (language === 'en') {
    // Convert to miles for English
    const miles = distance * 0.621371;
    
    // Format based on distance size
    if (miles < 0.1) {
      return `${Math.round(miles * 5280)} ft`;
    } else if (miles < 10) {
      return `${miles.toFixed(1)} mi`;
    } else {
      return `${Math.round(miles)} mi`;
    }
  } else {
    // Format km for Chinese
    if (distance < 0.1) {
      return `${Math.round(distance * 1000)} 米`;
    } else if (distance < 10) {
      return `${distance.toFixed(1)} 公里`;
    } else {
      return `${Math.round(distance)} 公里`;
    }
  }
};

/**
 * Converts kilometers to miles
 * @param km Distance in kilometers
 * @returns Distance in miles
 */
export const kmToMiles = (km: number): number => {
  return km * 0.621371;
};

/**
 * Converts miles to kilometers
 * @param miles Distance in miles
 * @returns Distance in kilometers
 */
export const milesToKm = (miles: number): number => {
  return miles / 0.621371;
};

/**
 * Gets the appropriate distance unit based on language
 * @param language Language code ('en' for miles, 'zh' for km)
 * @returns Distance unit string
 */
export const getDistanceUnit = (language: string = 'en'): string => {
  return language === 'en' ? 'mi' : '公里';
};

/**
 * Formats a value according to the current language
 * @param value The numeric value to format
 * @param language Language code ('en' or 'zh')
 * @returns Formatted string
 */
export const formatNumber = (value: number, language: string = 'en'): string => {
  if (language === 'en') {
    return new Intl.NumberFormat('en-US').format(value);
  } else {
    return new Intl.NumberFormat('zh-CN').format(value);
  }
};
