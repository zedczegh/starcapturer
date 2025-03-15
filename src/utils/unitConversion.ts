
/**
 * Unit conversion utilities for the app
 */

/**
 * Convert kilometers to miles
 * @param km Distance in kilometers
 * @returns Distance in miles
 */
export const kmToMiles = (km: number): number => {
  return km * 0.621371;
};

/**
 * Convert miles to kilometers
 * @param miles Distance in miles
 * @returns Distance in kilometers
 */
export const milesToKm = (miles: number): number => {
  return miles / 0.621371;
};

/**
 * Convert meters to feet
 * @param meters Distance in meters
 * @returns Distance in feet
 */
export const metersToFeet = (meters: number): number => {
  return meters * 3.28084;
};

/**
 * Convert feet to meters
 * @param feet Distance in feet
 * @returns Distance in meters
 */
export const feetToMeters = (feet: number): number => {
  return feet / 3.28084;
};

/**
 * Convert Celsius to Fahrenheit
 * @param celsius Temperature in Celsius
 * @returns Temperature in Fahrenheit
 */
export const celsiusToFahrenheit = (celsius: number): number => {
  return (celsius * 9/5) + 32;
};

/**
 * Convert Fahrenheit to Celsius
 * @param fahrenheit Temperature in Fahrenheit
 * @returns Temperature in Celsius
 */
export const fahrenheitToCelsius = (fahrenheit: number): number => {
  return (fahrenheit - 32) * 5/9;
};

/**
 * Format a temperature based on the language/unit system
 * @param celsius Temperature in Celsius
 * @param language 'en' for English (Fahrenheit) or 'zh' for Chinese (Celsius)
 * @returns Formatted temperature string with units
 */
export const formatTemperature = (celsius: number, language: 'en' | 'zh'): string => {
  if (language === 'en') {
    const fahrenheit = celsiusToFahrenheit(celsius);
    return `${Math.round(fahrenheit)}°F`;
  }
  return `${Math.round(celsius)}°C`;
};

/**
 * Format a distance value based on the language/unit system
 * @param kilometers Distance in kilometers
 * @param language 'en' for English (miles) or 'zh' for Chinese (kilometers)
 * @returns Formatted distance string with units
 */
export const formatDistance = (kilometers: number, language: 'en' | 'zh'): string => {
  if (language === 'en') {
    const miles = kmToMiles(kilometers);
    if (miles < 0.1) {
      return `${Math.round(miles * 1760)} yards`;
    } else if (miles < 10) {
      return `${miles.toFixed(1)} miles`;
    } else {
      return `${Math.round(miles).toLocaleString()} miles`;
    }
  } else {
    if (kilometers < 1) {
      return `${Math.round(kilometers * 1000)} 米`;
    } else if (kilometers < 10) {
      return `${kilometers.toFixed(1)} 公里`;
    } else {
      return `${Math.round(kilometers).toLocaleString()} 公里`;
    }
  }
};

/**
 * Format a distance with proper units for the DistanceRangeSlider component
 * @param kilometers Distance in kilometers
 * @param language 'en' for English (miles) or 'zh' for Chinese (kilometers)
 * @returns Formatted distance string with units
 */
export const formatSliderDistance = (kilometers: number, language: 'en' | 'zh'): string => {
  if (language === 'en') {
    const miles = kmToMiles(kilometers);
    return `${Math.round(miles).toLocaleString()} mi`;
  } else {
    return `${kilometers.toLocaleString()} km`;
  }
};

/**
 * Format a distance with additional "away" text for location cards
 * @param distance Distance in kilometers (or undefined)
 * @param language 'en' for English (miles) or 'zh' for Chinese (kilometers)
 * @returns Formatted distance string with "away" text
 */
export const formatLocationDistance = (distance: number | undefined, language: 'en' | 'zh'): string => {
  if (distance === undefined) return language === 'en' ? "Unknown distance" : "未知距离";
  
  if (language === 'en') {
    const miles = kmToMiles(distance);
    if (miles < 1) 
      return `${Math.round(miles * 1760)} yards away`;
    if (miles < 100) 
      return `${miles.toFixed(1)} miles away`;
    return `${Math.round(miles).toLocaleString()} miles away`;
  } else {
    if (distance < 1) 
      return `距离 ${Math.round(distance * 1000)} 米`;
    if (distance < 100) 
      return `距离 ${distance.toFixed(1)} 公里`;
    return `距离 ${Math.round(distance).toLocaleString()} 公里`;
  }
};
