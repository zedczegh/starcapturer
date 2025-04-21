
import { LocationEntry } from '@/data/locationDatabase';
import { calculateDistance } from '@/utils/geoUtils';

export function findClosestLocationImpl(
  latitude: number, 
  longitude: number, 
  database: LocationEntry[]
): { name: string; bortleScale: number; distance: number; type?: string } {
  let closestLocation = database[0];
  let minDistance = Infinity;

  for (const location of database) {
    const distance = calculateDistance(
      latitude,
      longitude,
      location.coordinates[0],
      location.coordinates[1]
    );

    if (distance < minDistance) {
      minDistance = distance;
      closestLocation = location;
    }
  }

  return {
    name: closestLocation.name,
    bortleScale: closestLocation.bortleScale,
    distance: minDistance,
    type: closestLocation.type
  };
}

export function getLocationInfoImpl(
  latitude: number,
  longitude: number,
  database: LocationEntry[]
): { name: string; bortleScale: number; formattedName: string } {
  const { name, bortleScale } = findClosestLocationImpl(latitude, longitude, database);
  
  return {
    name,
    bortleScale,
    formattedName: `${name}`
  };
}
