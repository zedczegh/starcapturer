
import { calculateDistance } from '@/utils/geoUtils';
import type { LocationEntry } from '@/data/locationDatabase';
import { locationDatabase, getLocationInfo } from '@/data/locationDatabase';

/**
 * Get nearby locations within a specified radius
 */
export const getNearbyLocations = (
  latitude: number, 
  longitude: number, 
  radius: number = 100,
  limit: number = 20
) => {
  if (!locationDatabase || !Array.isArray(locationDatabase)) {
    console.error('Location database is not available');
    return [];
  }
  
  return locationDatabase
    .map(location => {
      const [locLat, locLng] = location.coordinates;
      const distance = calculateDistance(latitude, longitude, locLat, locLng);
      return { ...location, distance };
    })
    .filter(location => location.distance <= radius)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
};

/**
 * Find certified locations within a radius
 */
export const findCertifiedLocations = (
  latitude: number, 
  longitude: number, 
  radius: number = 1000,
  limit: number = 20
) => {
  if (!locationDatabase || !Array.isArray(locationDatabase)) {
    console.error('Location database is not available');
    return [];
  }
  
  return locationDatabase
    .filter(location => location.certification || location.isDarkSkyReserve)
    .map(location => {
      const [locLat, locLng] = location.coordinates;
      const distance = calculateDistance(latitude, longitude, locLat, locLng);
      return { ...location, distance };
    })
    .filter(location => location.distance <= radius)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
};

export { getLocationInfo };
