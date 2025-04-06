
/**
 * Format distance in a user-friendly way
 * @param distance Distance in kilometers
 * @param language User language preference
 * @returns Formatted distance string
 */
export function formatDistanceFriendly(distance: number, language: string = 'en'): string {
  if (!isFinite(distance)) {
    return language === 'en' ? 'Unknown distance' : '未知距离';
  }
  
  // For very short distances
  if (distance < 0.1) {
    return language === 'en' ? 'Very close' : '非常近';
  }
  
  // For distances under 1 km
  if (distance < 1) {
    const meters = Math.round(distance * 1000);
    return language === 'en' ? `${meters} m` : `${meters} 米`;
  }
  
  // For distances under 10 km, use one decimal
  if (distance < 10) {
    return language === 'en' ? `${distance.toFixed(1)} km` : `${distance.toFixed(1)} 公里`;
  }
  
  // Round to whole number for larger distances
  return language === 'en' ? `${Math.round(distance)} km` : `${Math.round(distance)} 公里`;
}
