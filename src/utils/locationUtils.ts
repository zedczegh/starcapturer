
/**
 * Calculate the distance between two coordinates using the Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
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
  return R * c;
}

/**
 * Calculate the bearing between two coordinates
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Bearing in degrees (0-360)
 */
export function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const lat1Rad = lat1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;
  const lonDiff = (lon2 - lon1) * Math.PI / 180;
  
  const y = Math.sin(lonDiff) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
            Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(lonDiff);
  
  let bearing = Math.atan2(y, x) * 180 / Math.PI;
  bearing = (bearing + 360) % 360; // Convert to 0-360 range
  
  return bearing;
}

/**
 * Get cardinal direction from bearing
 * @param bearing Bearing in degrees
 * @returns Cardinal direction (N, NE, E, etc.)
 */
export function getCardinalDirection(bearing: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
}

/**
 * Format distance for display
 * @param distance Distance in kilometers
 * @param language Language code ('en' or 'zh')
 * @returns Formatted distance string
 */
export function formatDistance(distance: number, language: string = 'en'): string {
  if (language === 'zh') {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}米`;
    }
    return `${Math.round(distance)}公里`;
  }
  
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${Math.round(distance)}km`;
}

/**
 * Find the closest known location to given coordinates
 * @param latitude Latitude
 * @param longitude Longitude
 * @returns Object with location name, bortle scale, and distance
 */
export function findClosestKnownLocation(latitude: number, longitude: number): {
  name: string;
  bortleScale: number;
  distance: number;
} {
  // Simple fallback implementation if database isn't loaded
  return {
    name: `Location at ${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
    bortleScale: 5,
    distance: 0
  };
}

/**
 * Estimate Bortle scale based on location name and coordinates
 * @param locationName Location name
 * @param latitude Latitude
 * @param longitude Longitude
 * @returns Estimated Bortle scale (1-9)
 */
export function estimateBortleScaleByLocation(locationName: string, latitude: number, longitude: number): number {
  // Default estimation logic - simplified version
  if (!locationName) return 5;
  
  const lowercaseName = locationName.toLowerCase();
  
  // Detect urban/city areas
  if (lowercaseName.includes('city') || 
      lowercaseName.includes('urban') || 
      lowercaseName.includes('downtown') ||
      lowercaseName.includes('metro')) {
    return 8;
  }
  
  // Detect suburban areas
  if (lowercaseName.includes('suburb') || 
      lowercaseName.includes('residential') || 
      lowercaseName.includes('town')) {
    return 6;
  }
  
  // Detect rural areas
  if (lowercaseName.includes('rural') || 
      lowercaseName.includes('village') || 
      lowercaseName.includes('countryside')) {
    return 4;
  }
  
  // Detect wilderness/remote areas
  if (lowercaseName.includes('wilderness') || 
      lowercaseName.includes('park') || 
      lowercaseName.includes('forest') ||
      lowercaseName.includes('mountain') ||
      lowercaseName.includes('remote')) {
    return 3;
  }
  
  // Fallback based on location
  const isRemoteLocation = Math.abs(latitude) > 60 || // Far north/south
                          (Math.abs(longitude) > 100 && Math.abs(latitude) < 30); // Desert regions
  
  return isRemoteLocation ? 3 : 5;
}
