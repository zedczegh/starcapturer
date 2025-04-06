
import { SharedAstroSpot } from './astroSpots';
import { fetchWithTimeout } from './fetchUtils';

/**
 * Fetch dark sky locations from the API
 */
export async function fetchDarkSkyLocations(): Promise<SharedAstroSpot[]> {
  try {
    const apiUrl = '/api/darksky-locations';
    const response = await fetchWithTimeout(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch dark sky locations: ${response.status}`);
    }
    
    const data = await response.json();
    return data.locations || [];
  } catch (error) {
    console.error('Error fetching dark sky locations:', error);
    // Return mock data for development
    return getMockDarkSkyLocations();
  }
}

/**
 * Get mock dark sky locations for development
 */
function getMockDarkSkyLocations(): SharedAstroSpot[] {
  return [
    {
      id: 'ds-001',
      name: 'Cherry Springs State Park',
      description: 'International Dark Sky Park',
      latitude: 41.6657,
      longitude: -77.8238,
      bortleScale: 2,
      certification: 'International Dark Sky Park',
      isDarkSkyReserve: true
    },
    {
      id: 'ds-002',
      name: 'Death Valley National Park',
      description: 'International Dark Sky Park',
      latitude: 36.5323,
      longitude: -116.9325,
      bortleScale: 1,
      certification: 'International Dark Sky Park',
      isDarkSkyReserve: true
    },
    {
      id: 'ds-003',
      name: 'Natural Bridges National Monument',
      description: 'First International Dark Sky Park',
      latitude: 37.6212,
      longitude: -109.9758,
      bortleScale: 1,
      certification: 'International Dark Sky Park',
      isDarkSkyReserve: true
    },
    {
      id: 'ds-004',
      name: 'NamibRand Nature Reserve',
      description: 'Africa\'s first International Dark Sky Reserve',
      latitude: -25.0280,
      longitude: 16.0729,
      bortleScale: 1,
      certification: 'International Dark Sky Reserve',
      isDarkSkyReserve: true
    },
    {
      id: 'ds-005',
      name: 'Aoraki Mackenzie',
      description: 'International Dark Sky Reserve in New Zealand',
      latitude: -43.7340,
      longitude: 170.0966,
      bortleScale: 2,
      certification: 'International Dark Sky Reserve',
      isDarkSkyReserve: true
    }
  ];
}
