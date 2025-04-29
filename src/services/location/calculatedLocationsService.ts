
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { calculateDistance } from '@/utils/geoUtils';

/**
 * Local storage for locations
 */
let locationStore: Map<string, SharedAstroSpot> = new Map();

/**
 * Add a location to the persistent store
 */
export function addLocationToStore(location: SharedAstroSpot): void {
  if (location && location.latitude && location.longitude) {
    const key = `${location.latitude.toFixed(6)}-${location.longitude.toFixed(6)}`;
    locationStore.set(key, location);
  }
}

/**
 * Get a location from the store by coordinates
 */
export function getLocationFromStore(latitude: number, longitude: number): SharedAstroSpot | undefined {
  const key = `${latitude.toFixed(6)}-${longitude.toFixed(6)}`;
  return locationStore.get(key);
}

/**
 * Generate a grid of points within a radius of a center point
 * @param centerLat Center latitude
 * @param centerLng Center longitude
 * @param radiusKm Radius in kilometers
 * @param maxPoints Maximum number of points to generate
 * @returns Array of locations with latitude, longitude, and distance
 */
export async function findNearestImprovedLocations(
  centerLat: number,
  centerLng: number,
  radiusKm: number,
  maxPoints: number = 20
): Promise<{latitude: number; longitude: number; distance: number}[]> {
  // Create a grid of points within the radius
  const locations = [];
  const numPoints = Math.min(maxPoints, 100); // Limit to 100 points max for performance
  
  // Create a grid pattern for better coverage
  const gridSize = Math.ceil(Math.sqrt(numPoints));
  const step = (radiusKm * 2) / gridSize;
  
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      // Calculate offset from center (in km)
      const xOffset = -radiusKm + (i * step);
      const yOffset = -radiusKm + (j * step);
      
      // Convert km offset to lat/lng (approximate)
      // 0.01 degrees is roughly 1.11km at the equator
      const latOffset = yOffset / 111;
      const lngOffset = xOffset / (111 * Math.cos(centerLat * Math.PI / 180));
      
      const lat = centerLat + latOffset;
      const lng = centerLng + lngOffset;
      
      // Calculate actual distance
      const distance = calculateDistance(centerLat, centerLng, lat, lng);
      
      // Only include points within the radius
      if (distance <= radiusKm) {
        locations.push({
          latitude: lat,
          longitude: lng,
          distance
        });
      }
    }
  }
  
  // Sort by distance from center
  locations.sort((a, b) => a.distance - b.distance);
  
  // Limit to maxPoints
  return locations.slice(0, maxPoints);
}
