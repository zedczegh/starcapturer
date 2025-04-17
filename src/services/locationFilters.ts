
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { isWaterLocation } from '@/lib/api/astroSpots';

/**
 * Generate a random point within a radius
 */
export function generateRandomPoint(
  centerLat: number,
  centerLng: number,
  radiusKm: number
): { latitude: number; longitude: number; distance: number } {
  // Convert radius from kilometers to degrees
  const radiusInDegrees = radiusKm / 111.32;
  
  // Generate a random angle in radians
  const randomAngle = Math.random() * Math.PI * 2;
  
  // Generate a random radius between 0.1*radiusInDegrees and radiusInDegrees
  const randomRadius = (0.1 + 0.9 * Math.random()) * radiusInDegrees;
  
  // Calculate the new position
  const latitude = centerLat + randomRadius * Math.cos(randomAngle);
  const longitude = centerLng + randomRadius * Math.sin(randomAngle) / Math.cos(centerLat * Math.PI / 180);
  
  // Calculate actual distance in kilometers
  const distance = haversineDistance(centerLat, centerLng, latitude, longitude);
  
  return { latitude, longitude, distance };
}

/**
 * Calculate haversine distance between two points
 */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Filter out locations based on various criteria
 */
export function filterLocations(
  locations: SharedAstroSpot[],
  options: {
    excludeWater?: boolean;
    minBortle?: number;
    maxBortle?: number;
    minSiqs?: number;
    certifiedOnly?: boolean;
    radius?: number;
    centerLat?: number;
    centerLng?: number;
  }
): SharedAstroSpot[] {
  if (!locations || !Array.isArray(locations) || locations.length === 0) {
    return [];
  }
  
  return locations.filter(location => {
    // Skip invalid locations
    if (!location || !location.latitude || !location.longitude) {
      return false;
    }
    
    // Filter out water locations if requested
    if (options.excludeWater && isWaterLocation(location.latitude, location.longitude)) {
      return false;
    }
    
    // Filter by Bortle scale
    if (options.minBortle !== undefined && location.bortleScale < options.minBortle) {
      return false;
    }
    if (options.maxBortle !== undefined && location.bortleScale > options.maxBortle) {
      return false;
    }
    
    // Filter by SIQS
    if (options.minSiqs !== undefined) {
      const siqs = typeof location.siqs === 'number' ? location.siqs : 
                  (location.siqs && typeof location.siqs === 'object' ? location.siqs.score : 0);
      if (siqs < options.minSiqs) {
        return false;
      }
    }
    
    // Filter by certification
    if (options.certifiedOnly && !location.certification && !location.isDarkSkyReserve) {
      return false;
    }
    
    // Filter by radius
    if (options.radius !== undefined && options.centerLat !== undefined && options.centerLng !== undefined) {
      const distance = haversineDistance(
        options.centerLat,
        options.centerLng,
        location.latitude,
        location.longitude
      );
      if (distance > options.radius) {
        return false;
      }
    }
    
    return true;
  });
}
