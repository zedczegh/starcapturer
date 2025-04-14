
/**
 * Format distance in a user-friendly way
 * @param distance Distance in kilometers
 * @param language Current display language (en or zh)
 * @returns Formatted distance string
 */
export function formatDistance(distance: number, language: string = 'en'): string {
  if (!isFinite(distance)) {
    return language === 'en' ? 'Unknown distance' : '未知距离';
  }
  
  // For very close locations
  if (distance < 0.1) {
    return language === 'en' 
      ? 'Current location' 
      : '当前位置';
  }
  
  // For locations under 1 km away
  if (distance < 1) {
    const meters = Math.round(distance * 1000);
    return language === 'en' 
      ? `${meters} m away` 
      : `距离 ${meters} 米`;
  }
  
  // For locations 1-10 km away, use one decimal place
  if (distance < 10) {
    return language === 'en' 
      ? `${distance.toFixed(1)} km away` 
      : `距离 ${distance.toFixed(1)} 公里`;
  }
  
  // For locations 10-100 km away, use whole numbers
  if (distance < 100) {
    return language === 'en' 
      ? `${Math.round(distance)} km away` 
      : `距离 ${Math.round(distance)} 公里`;
  }
  
  // For very distant locations, round to nearest 10 km
  const roundedDistance = Math.round(distance / 10) * 10;
  return language === 'en' 
    ? `${roundedDistance} km away` 
    : `距离 ${roundedDistance} 公里`;
}
