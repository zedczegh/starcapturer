
/**
 * Format a distance number into a human-readable string
 * @param distance Distance in kilometers
 * @returns Formatted distance string
 */
export const formatDistance = (distance: number | undefined): string => {
  if (distance === undefined) return "";
  
  if (distance < 1) {
    // Convert to meters if less than 1km
    return `${Math.round(distance * 1000)}m`;
  }
  
  if (distance < 10) {
    // Show one decimal for distances under 10km
    return `${distance.toFixed(1)}km`;
  }
  
  // Round to nearest integer for larger distances
  return `${Math.round(distance)}km`;
};

/**
 * Format a date string into a human-readable format
 * @param dateStr Date string
 * @returns Formatted date string
 */
export const formatDate = (dateStr: string | undefined): string => {
  if (!dateStr) return "";
  
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  } catch (e) {
    return dateStr;
  }
};
