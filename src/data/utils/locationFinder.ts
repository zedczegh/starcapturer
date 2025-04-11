
import { locationDatabase } from '@/data/locationDatabase';
import type { LocationEntry } from '@/data/locationDatabase';
import { calculateDistance } from '@/utils/geoUtils';

/**
 * Find certified locations within radius
 */
export const findCertifiedLocationsInRadius = (
  latitude: number,
  longitude: number,
  radius: number = 500
): LocationEntry[] => {
  return locationDatabase
    .filter(location => location.certification || location.isDarkSkyReserve)
    .map(location => {
      const [locLat, locLng] = location.coordinates;
      const distance = calculateDistance(latitude, longitude, locLat, locLng);
      return {...location, distance};
    })
    .filter(location => location.distance <= radius)
    .sort((a, b) => a.distance - b.distance);
};

/**
 * Find quality dark sky locations (Bortle <= 3) within radius
 */
export const findQualityLocationsInRadius = (
  latitude: number,
  longitude: number,
  radius: number = 300
): LocationEntry[] => {
  return locationDatabase
    .filter(location => location.bortleScale <= 3)
    .map(location => {
      const [locLat, locLng] = location.coordinates;
      const distance = calculateDistance(latitude, longitude, locLat, locLng);
      return {...location, distance};
    })
    .filter(location => location.distance <= radius)
    .sort((a, b) => a.distance - b.distance);
};
