
/**
 * Utility for converting and formatting units of measurement
 * Handles distance, area, and other unit conversions with localization support
 */

/**
 * Format a distance value with appropriate units
 * @param distance Distance in kilometers
 * @param language Language code (en or zh)
 * @returns Formatted distance string
 */
export function formatDistance(distance: number, language?: string): string {
  if (distance === undefined || distance === null) {
    return language === 'zh' ? '未知距离' : 'Unknown distance';
  }
  
  // For very small distances, show in meters
  if (distance < 1) {
    const meters = Math.round(distance * 1000);
    return language === 'zh' ? `${meters}米` : `${meters}m`;
  }
  
  // For distances less than 10km, show with 1 decimal place
  if (distance < 10) {
    return language === 'zh' ? `${distance.toFixed(1)}公里` : `${distance.toFixed(1)}km`;
  }
  
  // For larger distances, round to integer
  return language === 'zh' ? `${Math.round(distance)}公里` : `${Math.round(distance)}km`;
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
