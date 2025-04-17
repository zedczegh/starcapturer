
/**
 * Utility for geographic calculations
 */

/**
 * Calculate distance between two points using the haversine formula
 * @param lat1 Latitude of first point in decimal degrees
 * @param lon1 Longitude of first point in decimal degrees
 * @param lat2 Latitude of second point in decimal degrees
 * @param lon2 Longitude of second point in decimal degrees
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = degToRad(lat2 - lat1);
  const dLon = degToRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degToRad(lat1)) *
    Math.cos(degToRad(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

/**
 * Convert degrees to radians
 */
export function degToRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Get SIQS score safely from different possible formats
 */
export function getSafeScore(siqs: number | { score: number; isViable: boolean } | undefined): number {
  if (typeof siqs === 'number') {
    return siqs;
  }
  
  if (siqs && typeof siqs === 'object' && 'score' in siqs) {
    return siqs.score;
  }
  
  return 0;
}

/**
 * Format SIQS score for display
 * @param score SIQS score value
 * @returns Formatted score string
 */
export function formatSIQSScore(score: number | any): string {
  if (typeof score === 'number') {
    return score.toFixed(1);
  }
  
  if (score && typeof score === 'object' && 'score' in score) {
    return score.score.toFixed(1);
  }
  
  return 'N/A';
}

/**
 * Format distance for display
 * @param distance Distance in kilometers
 * @param language Language code for localization
 * @returns Formatted distance string
 */
export function formatDistance(distance?: number, language: string = 'en'): string {
  if (distance === undefined || distance === null) return '';
  
  if (language === 'zh') {
    return `${distance.toFixed(1)} 公里`;
  } else {
    const miles = distance * 0.621371;
    return `${miles.toFixed(1)} mi`;
  }
}
