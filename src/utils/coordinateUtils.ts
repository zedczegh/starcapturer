
/**
 * Utility functions for coordinate validation and processing
 */

/**
 * Validate if coordinates are within valid ranges
 * @param latitude Latitude value (-90 to 90)
 * @param longitude Longitude value (-180 to 180)
 * @returns True if coordinates are valid
 */
export function validateCoordinates(latitude: number | undefined, longitude: number | undefined): boolean {
  if (latitude === undefined || longitude === undefined) {
    return false;
  }
  
  // Check if values are numbers and within valid range
  return !isNaN(latitude) && 
         !isNaN(longitude) && 
         latitude >= -90 && 
         latitude <= 90 && 
         longitude >= -180 && 
         longitude <= 180;
}

/**
 * Calculate distance between two sets of coordinates (in kilometers)
 * @param lat1 First latitude
 * @param lon1 First longitude
 * @param lat2 Second latitude
 * @param lon2 Second longitude
 * @returns Distance in kilometers
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

/**
 * Convert degrees to radians
 * @param deg Degrees
 * @returns Radians
 */
function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}
