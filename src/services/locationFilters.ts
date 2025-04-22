
// Optimized location filtering and generation services

/**
 * Generate a random point within a radius of a given center point
 * @param centerLat Center latitude
 * @param centerLng Center longitude
 * @param radius Radius in kilometers
 * @returns Object with latitude, longitude and distance
 */
export function generateRandomPoint(centerLat: number, centerLng: number, radius: number): {
  latitude: number;
  longitude: number;
  distance: number;
} {
  // Earth's radius in kilometers
  const earthRadius = 6371;
  
  // Convert radius from kilometers to radians
  const radiusInRadians = radius / earthRadius;
  
  // Convert coordinates to radians
  const centerLatRad = toRadians(centerLat);
  const centerLngRad = toRadians(centerLng);
  
  // Generate random distance within radius
  // Use square root to ensure uniform distribution
  const randomDistance = radiusInRadians * Math.sqrt(Math.random());
  
  // Generate random angle
  const randomAngle = Math.random() * Math.PI * 2;
  
  // Calculate new random point coordinates
  const newLatRad = Math.asin(
    Math.sin(centerLatRad) * Math.cos(randomDistance) +
    Math.cos(centerLatRad) * Math.sin(randomDistance) * Math.cos(randomAngle)
  );
  
  const newLngRad = centerLngRad + Math.atan2(
    Math.sin(randomAngle) * Math.sin(randomDistance) * Math.cos(centerLatRad),
    Math.cos(randomDistance) - Math.sin(centerLatRad) * Math.sin(newLatRad)
  );
  
  // Convert back to degrees
  const newLat = toDegrees(newLatRad);
  const newLng = toDegrees(newLngRad);
  
  // Calculate actual distance using Haversine formula
  const distanceInKm = calculateDistance(centerLat, centerLng, newLat, newLng);
  
  return {
    latitude: newLat,
    longitude: newLng,
    distance: distanceInKm
  };
}

/**
 * Calculate distance between two points using Haversine formula
 * @param lat1 First latitude
 * @param lng1 First longitude
 * @param lat2 Second latitude
 * @param lng2 Second longitude
 * @returns Distance in kilometers
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  // Earth's radius in kilometers
  const radius = 6371;
  
  // Convert coordinates to radians
  const lat1Rad = toRadians(lat1);
  const lng1Rad = toRadians(lng1);
  const lat2Rad = toRadians(lat2);
  const lng2Rad = toRadians(lng2);
  
  // Differences
  const dLat = lat2Rad - lat1Rad;
  const dLng = lng2Rad - lng1Rad;
  
  // Haversine formula
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return radius * c;
}

/**
 * Convert degrees to radians
 * @param degrees Angle in degrees
 * @returns Angle in radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees
 * @param radians Angle in radians
 * @returns Angle in degrees
 */
function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Generate a grid of points around the center
 * @param centerLat Center latitude
 * @param centerLng Center longitude
 * @param radius Radius in kilometers
 * @param gridSize Number of points in each direction
 * @returns Array of points with latitude, longitude and distance
 */
export function generatePointGrid(
  centerLat: number,
  centerLng: number,
  radius: number,
  gridSize: number = 5
): Array<{ latitude: number; longitude: number; distance: number }> {
  const points = [];
  
  // Calculate approximate degree ranges
  // 1 degree of latitude is ~111km, 1 degree of longitude varies with latitude
  const latRange = radius / 111;
  const lngRange = radius / (111 * Math.cos(toRadians(centerLat)));
  
  // Generate grid of points
  for (let i = -gridSize; i <= gridSize; i++) {
    for (let j = -gridSize; j <= gridSize; j++) {
      // Skip center point
      if (i === 0 && j === 0) continue;
      
      // Calculate grid coordinates
      const factor = 0.8; // Adjustment factor to ensure points are within radius
      const lat = centerLat + (i / gridSize) * latRange * factor;
      const lng = centerLng + (j / gridSize) * lngRange * factor;
      
      // Calculate actual distance
      const distance = calculateDistance(centerLat, centerLng, lat, lng);
      
      // Only include points within the specified radius
      if (distance <= radius) {
        points.push({
          latitude: lat,
          longitude: lng,
          distance
        });
      }
    }
  }
  
  return points;
}
