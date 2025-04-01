
/**
 * Utility functions for converting and formatting units of measurement
 */

/**
 * Format distance to be displayed with appropriate units
 * @param distance Distance in kilometers
 * @param language Current language (en or zh)
 * @returns Formatted distance string
 */
export function formatDistance(distance: number, language: string = 'en'): string {
  if (distance === undefined || distance === null) {
    return language === 'zh' ? '未知距离' : 'Unknown distance';
  }
  
  // Display in meters if less than 1 km
  if (distance < 1) {
    const meters = Math.round(distance * 1000);
    return language === 'zh' 
      ? `${meters} 米`
      : `${meters} m`;
  }
  
  // Display with 1 decimal place if less than 10 km
  if (distance < 10) {
    return language === 'zh' 
      ? `${distance.toFixed(1)} 公里`
      : `${distance.toFixed(1)} km`;
  }
  
  // For larger distances, round to whole numbers
  return language === 'zh' 
    ? `${Math.round(distance)} 公里`
    : `${Math.round(distance)} km`;
}
