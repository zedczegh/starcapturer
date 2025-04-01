
/**
 * Unit conversion utilities for displaying distances in appropriate formats
 */

/**
 * Format a distance value for display with appropriate units
 * @param distance Distance in kilometers
 * @param language Current language (en or zh)
 * @returns Formatted distance string
 */
export function formatDistance(distance: number, language?: string): string {
  // Handle invalid or zero distance
  if (!distance || isNaN(distance)) {
    return language === 'zh' ? '未知距离' : 'Unknown distance';
  }
  
  // Format based on language and distance magnitude
  if (language === 'zh') {
    if (distance < 1) {
      // Convert to meters for very short distances
      const meters = Math.round(distance * 1000);
      return `${meters} 米`;
    } else if (distance < 10) {
      // Show one decimal place for medium distances
      return `${distance.toFixed(1)} 公里`;
    } else {
      // Round to nearest kilometer for longer distances
      return `${Math.round(distance)} 公里`;
    }
  } else {
    // English formatting
    if (distance < 1) {
      // Convert to meters for very short distances
      const meters = Math.round(distance * 1000);
      return `${meters} m`;
    } else if (distance < 10) {
      // Show one decimal place for medium distances
      return `${distance.toFixed(1)} km`;
    } else {
      // Round to nearest kilometer for longer distances
      return `${Math.round(distance)} km`;
    }
  }
}

/**
 * Convert kilometers to miles
 * @param km Distance in kilometers
 * @returns Distance in miles
 */
export function kmToMiles(km: number): number {
  return km * 0.621371;
}

/**
 * Convert miles to kilometers
 * @param miles Distance in miles
 * @returns Distance in kilometers
 */
export function milesToKm(miles: number): number {
  return miles / 0.621371;
}
