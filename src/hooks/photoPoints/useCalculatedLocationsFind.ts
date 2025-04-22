import { SharedAstroSpot } from '@/lib/api/astroSpots';

export type Coordinates = {
  latitude: number;
  longitude: number;
};

// Function to validate coordinates
export const validateCoordinates = (coords: Coordinates): boolean => {
  if (!coords) return false;
  const { latitude, longitude } = coords;
  if (typeof latitude !== 'number' || typeof longitude !== 'number') return false;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return false;
  return true;
};

// Function to normalize longitude
export const normalizeLongitude = (longitude: number): number => {
  if (longitude > 180) return longitude - 360;
  if (longitude < -180) return longitude + 360;
  return longitude;
};

// Function to calculate distance between two coordinates
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Radius of the Earth in kilometers
  const toRadians = (angle: number) => angle * Math.PI / 180;

  const lat1Rad = toRadians(lat1);
  const lon1Rad = toRadians(lon1);
  const lat2Rad = toRadians(lat2);
  const lon2Rad = toRadians(lon2);

  const dLat = lat2Rad - lat1Rad;
  const dLon = lon2Rad - lon1Rad;

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c;
  return distance;
};

export const findCalculatedLocations = async (
  latitude: number,
  longitude: number,
  radiusKm: number
): Promise<SharedAstroSpot[]> => {
  // Mock implementation - replace with actual data fetching
  await new Promise(resolve => setTimeout(resolve, 500));

  const mockLocations: SharedAstroSpot[] = [
    {
      id: '1',
      name: 'Mock Location 1',
      latitude: latitude + 0.1,
      longitude: longitude + 0.1,
      bortleScale: 4,
      siqs: 6.5,
      timestamp: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Mock Location 2',
      latitude: latitude - 0.1,
      longitude: longitude - 0.1,
      bortleScale: 3,
      siqs: 7.8,
      timestamp: new Date().toISOString()
    },
  ];

  // Simulate filtering by radius
  const filteredLocations = mockLocations.filter(loc => {
    const distance = calculateDistance(latitude, longitude, loc.latitude, loc.longitude);
    return distance <= radiusKm;
  });

  return filteredLocations;
};
