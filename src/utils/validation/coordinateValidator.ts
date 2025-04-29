
/**
 * Validate if coordinates are within valid range
 */
export function isValidCoordinates(latitude: number, longitude: number): boolean {
  return (
    isFinite(latitude) && 
    isFinite(longitude) &&
    latitude >= -90 && 
    latitude <= 90 && 
    longitude >= -180 && 
    longitude <= 180
  );
}

/**
 * Format coordinates to a nicely readable string
 */
export function formatCoordinates(latitude: number, longitude: number): string {
  if (!isValidCoordinates(latitude, longitude)) {
    return "Invalid coordinates";
  }
  
  const latDir = latitude >= 0 ? "N" : "S";
  const lonDir = longitude >= 0 ? "E" : "W";
  
  return `${Math.abs(latitude).toFixed(6)}° ${latDir}, ${Math.abs(longitude).toFixed(6)}° ${lonDir}`;
}
