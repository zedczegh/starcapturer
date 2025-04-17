
/**
 * Calculate the distance between two points on Earth's surface
 * using the Haversine formula
 * @param lat1 First point latitude
 * @param lon1 First point longitude
 * @param lat2 Second point latitude
 * @param lon2 Second point longitude
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  // Convert degrees to radians
  const toRadians = (degrees: number) => degrees * Math.PI / 180;
  
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const earthRadius = 6371; // Radius of the Earth in km
  
  return earthRadius * c;
}

/**
 * Format a distance value in a human-readable format
 * @param distance Distance in kilometers
 * @returns Formatted distance string
 */
export function formatDistance(distance: number): string {
  if (!isFinite(distance)) return '';
  
  if (distance < 1) {
    // Convert to meters for small distances
    const meters = Math.round(distance * 1000);
    return `${meters}m`;
  } else if (distance < 10) {
    // Show one decimal place for medium distances
    return `${distance.toFixed(1)}km`;
  } else {
    // Round to nearest kilometer for larger distances
    return `${Math.round(distance)}km`;
  }
}

/**
 * Get a safe numeric score from various SIQS formats
 * @param score SIQS value (can be number, object with score property, etc.)
 * @returns A numeric score or null if unavailable
 */
export function getSafeScore(score: any): number | null {
  if (score === null || score === undefined) return null;
  
  if (typeof score === 'number') {
    return isFinite(score) ? score : null;
  }
  
  if (typeof score === 'object') {
    // Handle {score: number} format
    if (score.score !== undefined && typeof score.score === 'number') {
      return isFinite(score.score) ? score.score : null;
    }
    
    // Handle {siqs: number} format
    if (score.siqs !== undefined && typeof score.siqs === 'number') {
      return isFinite(score.siqs) ? score.siqs : null;
    }
  }
  
  return null;
}
