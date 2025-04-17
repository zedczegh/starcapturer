
/**
 * Check if a location is likely on water
 * This is a simplified implementation that would be replaced with a proper GeoJSON water database
 */
export function isWaterLocation(latitude: number, longitude: number): boolean {
  // List of known large bodies of water
  const largeWaterBodies = [
    // Pacific Ocean
    { minLat: -60, maxLat: 60, minLng: 120, maxLng: 260 },
    // Atlantic Ocean
    { minLat: -60, maxLat: 60, minLng: -80, maxLng: 0 },
    // Indian Ocean
    { minLat: -60, maxLat: 30, minLng: 40, maxLng: 120 },
    // Mediterranean Sea
    { minLat: 30, maxLat: 45, minLng: -5, maxLng: 35 },
  ];
  
  // Check if location is in a large water body
  for (const waterBody of largeWaterBodies) {
    if (
      latitude >= waterBody.minLat &&
      latitude <= waterBody.maxLat &&
      longitude >= waterBody.minLng &&
      longitude <= waterBody.maxLng
    ) {
      // Rough check, but would need additional GeoJSON data for accuracy
      return true;
    }
  }
  
  return false;
}
