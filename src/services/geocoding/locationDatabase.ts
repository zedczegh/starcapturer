
import { locationDatabase } from '@/data/locationDatabase';

/**
 * Get nearby named locations for geographic context
 * @param latitude Central latitude
 * @param longitude Central longitude
 * @param maxDistance Maximum distance in kilometers
 * @returns Array of nearby locations with names and distances
 */
export function getNearbyNamedLocations(
  latitude: number,
  longitude: number,
  maxDistance: number = 100
) {
  if (!locationDatabase || !Array.isArray(locationDatabase)) {
    console.warn('Location database not available');
    return [];
  }
  
  return locationDatabase
    .filter(location => {
      // Calculate distance
      const [locLat, locLng] = location.coordinates;
      const dLat = Math.abs(latitude - locLat);
      const dLng = Math.abs(longitude - locLng);
      
      // Quick filter by bounding box before calculating actual distance
      if (dLat > 1 || dLng > 1) return false;
      
      // More detailed distance calculation would go here
      // For now, just use the bounding box approximation
      const roughDistance = Math.sqrt(dLat * dLat + dLng * dLng) * 111; // ~111km per degree
      return roughDistance <= maxDistance;
    })
    .map(location => ({
      name: location.name,
      chineseName: location.chineseName,
      coordinates: location.coordinates,
      type: location.type || 'natural',
      distance: calculateSimpleDistance(
        latitude, 
        longitude, 
        location.coordinates[0], 
        location.coordinates[1]
      )
    }))
    .sort((a, b) => a.distance - b.distance);
}

/**
 * Simple distance calculation for performance
 */
function calculateSimpleDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = (lat2 - lat1) * 111; // ~111km per degree latitude
  const dLng = (lng2 - lng1) * 111 * Math.cos((lat1 * Math.PI) / 180);
  return Math.sqrt(dLat * dLat + dLng * dLng);
}
