
/**
 * Coordinate system conversion utilities
 */

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
