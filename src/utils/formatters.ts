
/**
 * Format distance in kilometers with appropriate units
 * @param distance - Distance in kilometers
 * @returns Formatted distance string
 */
export const formatDistance = (distance: number): string => {
  if (distance === undefined || distance === null) return '';
  
  // For small distances, show in meters
  if (distance < 1) {
    const meters = Math.round(distance * 1000);
    return `${meters} m`;
  }
  
  // For medium distances, show with 1 decimal
  if (distance < 10) {
    return `${distance.toFixed(1)} km`;
  }
  
  // For larger distances, show as whole number
  return `${Math.round(distance)} km`;
};

/**
 * Format a date to a user-friendly string
 * @param date - Date string or Date object
 * @returns Formatted date string
 */
export const formatDate = (date: string | Date): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
};
