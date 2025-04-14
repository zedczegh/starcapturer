
/**
 * Format distance for display in either English or Chinese
 */
export function formatDistance(
  distance: number | undefined, 
  language: string = 'en'
): string {
  if (distance === undefined) {
    return language === 'en' ? 'Unknown distance' : '未知距离';
  }
  
  if (distance < 1) {
    return language === 'en' 
      ? `${Math.round(distance * 1000)} m away` 
      : `${Math.round(distance * 1000)} 米`;
  } else if (distance < 10) {
    return language === 'en' 
      ? `${distance.toFixed(1)} km away` 
      : `${distance.toFixed(1)} 公里`;
  } else {
    return language === 'en' 
      ? `${Math.round(distance)} km away` 
      : `${Math.round(distance)} 公里`;
  }
}
