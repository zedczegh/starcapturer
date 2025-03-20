
/**
 * Utility functions for geographic data and SIQS score formatting
 */

/**
 * Format SIQS score for display, handling various input formats
 * @param siqs SIQS score value (can be number or object)
 * @returns Formatted score as string
 */
export function formatSIQSScore(siqs: any): string {
  if (siqs === null || siqs === undefined) return "?";
  
  // If siqs is a number (either 0-10 or 0-100 scale)
  if (typeof siqs === 'number') {
    // Convert to 0-10 scale if needed
    const normalizedScore = siqs > 10 ? siqs / 10 : siqs;
    return normalizedScore.toFixed(1);
  }
  
  // If siqs is an object with a score property
  if (typeof siqs === 'object' && siqs !== null && 'score' in siqs) {
    // Convert to 0-10 scale if needed
    const score = siqs.score as number;
    const normalizedScore = score > 10 ? score / 10 : score;
    return normalizedScore.toFixed(1);
  }
  
  return "?";
}

/**
 * Get a safe score value regardless of input format
 * @param siqs SIQS value in any format
 * @returns Normalized score on 0-10 scale
 */
export function getSafeScore(siqs: any): number {
  if (siqs === null || siqs === undefined) return 0;
  
  if (typeof siqs === 'number') {
    return siqs > 10 ? siqs / 10 : siqs;
  }
  
  if (typeof siqs === 'object' && siqs !== null && 'score' in siqs) {
    const score = siqs.score as number;
    return score > 10 ? score / 10 : score;
  }
  
  return 0;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 First latitude
 * @param lon1 First longitude
 * @param lat2 Second latitude
 * @param lon2 Second longitude
 * @returns Distance in kilometers
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return distance;
}

/**
 * Format coordinates as a string
 * @param latitude Latitude
 * @param longitude Longitude
 * @param precision Number of decimal places
 * @returns Formatted coordinates string
 */
export function formatCoordinates(latitude: number, longitude: number, precision: number = 4): string {
  return `${latitude.toFixed(precision)}, ${longitude.toFixed(precision)}`;
}
