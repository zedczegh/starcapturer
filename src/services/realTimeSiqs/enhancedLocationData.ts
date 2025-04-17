
import { EnhancedLocation } from './siqsTypes';

// Sample database of enhanced locations
const enhancedLocations: EnhancedLocation[] = [
  {
    name: "Death Valley National Park",
    latitude: 36.5323,
    longitude: -116.9325,
    bortleScale: 2,
    clearSkyRate: 89,
    isDarkSkyReserve: true,
    averageVisibility: 'excellent'
  },
  {
    name: "Mauna Kea Observatory",
    latitude: 19.8207,
    longitude: -155.4681,
    bortleScale: 1,
    clearSkyRate: 93,
    isDarkSkyReserve: true,
    certification: "Gold Tier",
    averageVisibility: 'excellent'
  }
];

/**
 * Find the closest enhanced location within a given radius
 */
export function findClosestEnhancedLocation(
  latitude: number,
  longitude: number,
  maxDistanceKm: number = 50
): EnhancedLocation | null {
  let closestLocation: EnhancedLocation | null = null;
  let closestDistance = Number.MAX_VALUE;
  
  for (const location of enhancedLocations) {
    const distance = calculateDistance(
      latitude,
      longitude,
      location.latitude,
      location.longitude
    );
    
    if (distance < maxDistanceKm && distance < closestDistance) {
      closestDistance = distance;
      closestLocation = location;
    }
  }
  
  return closestLocation;
}

/**
 * Calculate the distance between two points in kilometers using the Haversine formula
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * Math.PI / 180;
}
