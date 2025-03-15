
/**
 * Unit conversion utilities with language-aware formatting
 */

/**
 * Format a distance for display based on the current language
 * Uses kilometers for Chinese and miles for English
 */
export function formatLocationDistance(distance: number | undefined, language: string): string {
  if (distance === undefined) return language === 'en' ? 'Unknown distance' : '未知距离';
  
  // For Chinese users, always use kilometers
  if (language === 'zh') {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}米`;
    } else if (distance < 10) {
      return `${distance.toFixed(1)}公里`;
    } else {
      return `${Math.round(distance)}公里`;
    }
  }
  
  // For English users, use miles
  const miles = distance * 0.621371;
  
  if (miles < 0.1) {
    return 'Very close';
  } else if (miles < 1) {
    return `${(miles * 5280 / 1000).toFixed(1)}K ft`;
  } else if (miles < 10) {
    return `${miles.toFixed(1)} mi`;
  } else {
    return `${Math.round(miles)} mi`;
  }
}

/**
 * Format a distance for a slider display
 */
export function formatSliderDistance(distance: number, language: string): string {
  if (language === 'zh') {
    return `${distance}公里`;
  } else {
    const miles = Math.round(distance * 0.621371);
    return `${miles} mi`;
  }
}

/**
 * Convert from metric to imperial units for temperature
 */
export function formatTemperature(celsius: number, language: string): string {
  if (language === 'zh') {
    return `${Math.round(celsius)}°C`;
  } else {
    const fahrenheit = (celsius * 9/5) + 32;
    return `${Math.round(fahrenheit)}°F`;
  }
}

/**
 * Format wind speed based on language
 */
export function formatWindSpeed(speedKmh: number, language: string): string {
  if (language === 'zh') {
    return `${Math.round(speedKmh)} km/h`;
  } else {
    const speedMph = speedKmh * 0.621371;
    return `${Math.round(speedMph)} mph`;
  }
}
