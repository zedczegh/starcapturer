
import { SharedAstroSpot } from '@/lib/siqs/types';
import { isValidAstronomyLocation } from '@/utils/locationValidator';

const LOCATION_CACHE_KEY = 'cachedAstroLocations';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface CachedLocationData {
  locations: SharedAstroSpot[];
  timestamp: number;
}

/**
 * Save locations to cache
 * @param locations Locations to cache
 * @param type Type of locations (certified or calculated)
 */
export const cacheLocations = (
  locations: SharedAstroSpot[], 
  type: 'certified' | 'calculated' = 'certified'
) => {
  try {
    // Only cache valid, non-empty arrays
    if (!locations || !Array.isArray(locations) || locations.length === 0) {
      return;
    }
    
    // Filter for valid locations only
    const validLocations = locations.filter(loc => 
      loc && loc.latitude && loc.longitude && 
      isValidAstronomyLocation(loc.latitude, loc.longitude)
    );
    
    const cacheKey = `${LOCATION_CACHE_KEY}_${type}`;
    const cacheData: CachedLocationData = {
      locations: validLocations,
      timestamp: Date.now()
    };
    
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    console.log(`Cached ${validLocations.length} ${type} locations`);
  } catch (error) {
    console.error('Error caching locations:', error);
  }
};

/**
 * Get locations from cache
 * @param type Type of locations to retrieve
 * @returns Cached locations if available and not expired
 */
export const getCachedLocations = (
  type: 'certified' | 'calculated' = 'certified'
): SharedAstroSpot[] | null => {
  try {
    const cacheKey = `${LOCATION_CACHE_KEY}_${type}`;
    const cachedData = localStorage.getItem(cacheKey);
    
    if (!cachedData) {
      return null;
    }
    
    const parsedData: CachedLocationData = JSON.parse(cachedData);
    
    // Check if cache is expired
    if (Date.now() - parsedData.timestamp > CACHE_EXPIRY) {
      console.log(`${type} location cache expired, clearing`);
      localStorage.removeItem(cacheKey);
      return null;
    }
    
    console.log(`Retrieved ${parsedData.locations.length} ${type} locations from cache`);
    return parsedData.locations;
  } catch (error) {
    console.error('Error retrieving cached locations:', error);
    return null;
  }
};

/**
 * Clear all location caches
 */
export const clearAllLocationCaches = () => {
  try {
    localStorage.removeItem(`${LOCATION_CACHE_KEY}_certified`);
    localStorage.removeItem(`${LOCATION_CACHE_KEY}_calculated`);
    console.log('All location caches cleared');
  } catch (error) {
    console.error('Error clearing location caches:', error);
  }
};
