
/**
 * Map utility functions to help with map operations and coordinate conversions
 */

// Earth radius in kilometers
const EARTH_RADIUS = 6371;

/**
 * Convert degrees to radians
 */
export const degToRad = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Calculate the great-circle distance between two points using the Haversine formula
 * @param lat1 Latitude of point 1 in degrees
 * @param lon1 Longitude of point 1 in degrees
 * @param lat2 Latitude of point 2 in degrees
 * @param lon2 Longitude of point 2 in degrees
 * @returns Distance in kilometers
 */
export const calculateDistance = (
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number => {
  const dLat = degToRad(lat2 - lat1);
  const dLon = degToRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(degToRad(lat1)) * Math.cos(degToRad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return EARTH_RADIUS * c;
};

/**
 * Normalize coordinates to ensure they're within standard ranges
 * This can help when comparing locations internationally
 */
export const normalizeCoordinates = (coords: { latitude: number, longitude: number }) => {
  return {
    latitude: Math.max(-90, Math.min(90, coords.latitude)),
    longitude: ((coords.longitude + 180) % 360 + 360) % 360 - 180
  };
};

/**
 * Convert WGS-84 coordinates to GCJ-02 (Chinese coordinate system)
 * This is a simplified implementation - for production use a more precise algorithm
 * NOTE: This is a critical function for maps in China
 */
export const wgs84ToGcj02 = (lat: number, lng: number): { lat: number; lng: number } => {
  // This is a placeholder for the actual conversion algorithm
  // For accurate implementation, use a specialized library
  
  // For testing purposes, we'll apply a small offset
  // but in production this should be replaced with an accurate algorithm
  const offsetLat = lat + 0.006;
  const offsetLng = lng + 0.0065;
  
  return { lat: offsetLat, lng: offsetLng };
};

/**
 * Get a URL for directions to a location using Gaode Maps
 * This works within China without VPN
 */
export const generateGaodeMapUrl = (
  lat: number, 
  lng: number, 
  name: string
): string => {
  // Convert to GCJ-02 for Gaode Maps
  const { lat: gcjLat, lng: gcjLng } = wgs84ToGcj02(lat, lng);
  
  // Encode the location name
  const encodedName = encodeURIComponent(name);
  
  return `https://uri.amap.com/marker?position=${gcjLng},${gcjLat}&name=${encodedName}`;
};

/**
 * Get a URL for directions to a location using Google Maps
 * This works better for international users
 */
export const generateGoogleMapUrl = (
  lat: number, 
  lng: number, 
  name: string
): string => {
  const encodedName = encodeURIComponent(name);
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${encodedName}`;
};

/**
 * Get a URL for directions to a location using Baidu Maps
 * This works within China without VPN
 */
export const generateBaiduMapUrl = (
  lat: number, 
  lng: number, 
  name: string
): string => {
  // Convert to GCJ-02 for Baidu Maps
  const { lat: gcjLat, lng: gcjLng } = wgs84ToGcj02(lat, lng);
  
  // Encode the location name
  const encodedName = encodeURIComponent(name);
  
  return `https://api.map.baidu.com/marker?location=${gcjLat},${gcjLng}&title=${encodedName}&output=html`;
};

/**
 * Validate coordinates to ensure they're within valid ranges
 */
export const validateCoordinates = (coords: { latitude: number, longitude: number }) => {
  let { latitude, longitude } = coords;
  
  // Clamp latitude to valid range
  latitude = Math.max(-90, Math.min(90, latitude));
  
  // Normalize longitude to -180 to 180 range
  longitude = ((longitude + 180) % 360 + 360) % 360 - 180;
  
  return { latitude, longitude };
};
