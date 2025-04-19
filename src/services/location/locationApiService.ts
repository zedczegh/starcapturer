
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { cacheLocations } from './locationCacheService';
import { fetchCertifiedLocations } from './certifiedLocationsService';
import { generateCalculatedLocations } from './calculatedLocationsService';

/**
 * Fetch locations from API sources
 */
export const fetchLocationsFromApi = async (
  latitude: number,
  longitude: number,
  radius: number
): Promise<SharedAstroSpot[]> => {
  try {
    // Get certified locations (dark sky reserves, etc.)
    const certifiedLocations = await fetchCertifiedLocations();
    
    // Generate calculated locations based on environmental data
    const calculatedLocations = await generateCalculatedLocations(
      latitude, 
      longitude, 
      radius
    );
    
    // Combine both types of locations
    const combinedLocations = [...certifiedLocations, ...calculatedLocations];
    
    // Cache the results for future use
    cacheLocations(latitude, longitude, radius, combinedLocations);
    
    return combinedLocations;
  } catch (error) {
    console.error('Error fetching locations from API:', error);
    return [];
  }
};
