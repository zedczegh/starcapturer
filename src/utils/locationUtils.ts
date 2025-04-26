
/**
 * Location utility functions for standardizing coordinate handling
 */

/**
 * Generate a location key for storage based on coordinates with specified precision
 * @param latitude Latitude coordinate
 * @param longitude Longitude coordinate
 * @param precision Grid size in degrees (0.1 is roughly 11km)
 * @returns Location key string
 */
export function getLocationKey(latitude: number, longitude: number, precision: number = 0.1): string {
  // Round to precision grid
  const latGrid = Math.round(latitude / precision) * precision;
  const lngGrid = Math.round(longitude / precision) * precision;
  
  return `${latGrid.toFixed(6)}-${lngGrid.toFixed(6)}`;
}

/**
 * Find nearby location keys within a certain radius
 * @param latitude Center latitude
 * @param longitude Center longitude
 * @param radiusKm Radius in kilometers
 * @param precision Grid precision in degrees
 * @returns Array of nearby location keys
 */
export function getNearbyLocationKeys(
  latitude: number, 
  longitude: number, 
  radiusKm: number = 10, 
  precision: number = 0.1
): string[] {
  // Approximate degree offset for radius
  // 0.01 degrees is roughly 1.11 km at equator
  const degreesPerKm = 0.01;
  const degreeOffset = radiusKm * degreesPerKm;
  
  const keys: string[] = [];
  const gridSteps = Math.ceil(degreeOffset / precision);
  
  // Generate grid of location keys
  for (let latStep = -gridSteps; latStep <= gridSteps; latStep++) {
    for (let lngStep = -gridSteps; lngStep <= gridSteps; lngStep++) {
      const lat = latitude + (latStep * precision);
      const lng = longitude + (lngStep * precision);
      
      keys.push(getLocationKey(lat, lng, precision));
    }
  }
  
  return keys;
}

/**
 * Calculate distance between two points in kilometers
 * @param lat1 First latitude
 * @param lon1 First longitude
 * @param lat2 Second latitude
 * @param lon2 Second longitude
 * @returns Distance in kilometers
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in kilometers
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Convert degrees to radians
 */
function deg2rad(deg: number): number {
  return deg * (Math.PI/180);
}
