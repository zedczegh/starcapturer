
import { SharedAstroSpot } from '@/lib/api/astroSpots';

const darkSkyLocations: SharedAstroSpot[] = [
  // Sample data - in a real app this would be loaded from a database or API
  {
    id: 'dark-sky-1',
    name: 'Natural Bridges National Monument',
    latitude: 37.4302,
    longitude: -109.6764,
    isDarkSkyReserve: true,
    bortleScale: 1,
    siqs: 95,
    isViable: true,
    distance: 0,
    timestamp: new Date().toISOString()
  },
  // Add more certified locations here
];

/**
 * Fetch certified dark sky locations
 */
export const fetchCertifiedLocations = async (): Promise<SharedAstroSpot[]> => {
  // In a real app, this would fetch from an API or database
  // For now, we'll just return our sample data
  
  return Promise.resolve([...darkSkyLocations]);
};
