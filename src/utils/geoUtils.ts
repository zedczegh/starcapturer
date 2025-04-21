
/**
 * High-performance geographical utilities
 */

// Earth radius in kilometers
const EARTH_RADIUS_KM = 6371;

/**
 * Convert degrees to radians
 * @param degrees Angle in degrees
 * @returns Angle in radians
 */
export function degToRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate distance between two points using the Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  // Convert latitude and longitude from degrees to radians
  const radLat1 = degToRad(lat1);
  const radLon1 = degToRad(lon1);
  const radLat2 = degToRad(lat2);
  const radLon2 = degToRad(lon2);
  
  // Haversine formula
  const dLat = radLat2 - radLat1;
  const dLon = radLon2 - radLon1;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(radLat1) * Math.cos(radLat2) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  // Distance in kilometers
  return EARTH_RADIUS_KM * c;
}

/**
 * Get the bearing between two points
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Bearing in degrees (0-360)
 */
export function calculateBearing(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const radLat1 = degToRad(lat1);
  const radLon1 = degToRad(lon1);
  const radLat2 = degToRad(lat2);
  const radLon2 = degToRad(lon2);
  
  const y = Math.sin(radLon2 - radLon1) * Math.cos(radLat2);
  const x = 
    Math.cos(radLat1) * Math.sin(radLat2) -
    Math.sin(radLat1) * Math.cos(radLat2) * Math.cos(radLon2 - radLon1);
  
  let bearing = Math.atan2(y, x);
  bearing = bearing * (180 / Math.PI); // Convert to degrees
  bearing = (bearing + 360) % 360; // Normalize to 0-360
  
  return bearing;
}

/**
 * Calculate destination point given a starting point, distance and bearing
 * @param lat Starting latitude in degrees
 * @param lon Starting longitude in degrees
 * @param distance Distance in kilometers
 * @param bearing Bearing in degrees (0 = north, 90 = east, etc.)
 * @returns Object with latitude and longitude of destination point
 */
export function calculateDestinationPoint(
  lat: number, 
  lon: number, 
  distance: number, 
  bearing: number
): { latitude: number; longitude: number } {
  const radLat = degToRad(lat);
  const radLon = degToRad(lon);
  const radBearing = degToRad(bearing);
  const angularDistance = distance / EARTH_RADIUS_KM;
  
  const destLatRad = Math.asin(
    Math.sin(radLat) * Math.cos(angularDistance) +
    Math.cos(radLat) * Math.sin(angularDistance) * Math.cos(radBearing)
  );
  
  const destLonRad = radLon + Math.atan2(
    Math.sin(radBearing) * Math.sin(angularDistance) * Math.cos(radLat),
    Math.cos(angularDistance) - Math.sin(radLat) * Math.sin(destLatRad)
  );
  
  // Convert back to degrees
  const destLat = destLatRad * (180 / Math.PI);
  const destLon = ((destLonRad * (180 / Math.PI)) + 540) % 360 - 180; // Normalize longitude
  
  return { latitude: destLat, longitude: destLon };
}

/**
 * Calculate bounding box around a point
 * @param lat Center latitude
 * @param lon Center longitude
 * @param radiusKm Radius in kilometers
 * @returns Object with minLat, maxLat, minLng, maxLng
 */
export function calculateBoundingBox(
  lat: number, 
  lon: number, 
  radiusKm: number
): { minLat: number; maxLat: number; minLng: number; maxLng: number } {
  // Approximate degrees latitude per km
  const latKm = 1 / 110.574;
  
  // Approximate degrees longitude per km at this latitude
  const lngKm = 1 / (111.320 * Math.cos(degToRad(lat)));
  
  // Calculate bounding box
  const latDelta = radiusKm * latKm;
  const lngDelta = radiusKm * lngKm;
  
  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lon - lngDelta,
    maxLng: lon + lngDelta
  };
}

/**
 * Format distance for display
 * @param distance Distance in kilometers
 * @returns Formatted distance string (e.g., "12.3 km" or "450 m")
 */
export function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${Math.round(distance * 1000)} m`;
  }
  return `${distance.toFixed(1)} km`;
}

/**
 * Format SIQS score for display with proper decimal places
 * @param siqs SIQS score
 * @param decimals Number of decimal places (default: 1)
 * @returns Formatted SIQS score string
 */
export function formatSIQSScore(siqs: number | null): string {
  if (siqs === null) return 'N/A';
  return siqs.toFixed(1);
}

/**
 * Get a safe numeric score from various SIQS formats
 * @param siqs SIQS value which could be a number or object
 * @returns Numeric SIQS score
 */
export function getSafeScore(siqs?: number | { score: number; isViable: boolean }): number {
  if (siqs === undefined) return 0;
  if (typeof siqs === 'number') return siqs;
  return siqs.score;
}
