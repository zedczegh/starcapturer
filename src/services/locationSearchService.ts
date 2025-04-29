import { SharedAstroSpot } from '@/types/weather';
import { calculateDistance } from '@/utils/geoUtils';
import { getRandomInt } from '@/utils/random';

// Options for location search
export interface LocationSearchOptions {
  minSiqs?: number;
  maxResults?: number;
  includeWater?: boolean;
  sortBy?: 'distance' | 'quality';
}

/**
 * Find locations within a specified radius of a center point
 * @param centerLat Center latitude
 * @param centerLon Center longitude
 * @param radiusKm Radius in kilometers
 * @param options Search options
 * @returns Array of locations
 */
export function findLocationsInArea(
  centerLat: number,
  centerLon: number,
  radiusKm: number,
  options?: LocationSearchOptions
): SharedAstroSpot[] {
  // Implementation details
  // In a real app, this would query an API or database
  // For now, it's a mock implementation
  
  const defaultOptions: LocationSearchOptions = {
    minSiqs: 0,
    maxResults: 20,
    includeWater: false,
    sortBy: 'distance'
  };
  
  const mergedOptions = { ...defaultOptions, ...options };
  
  // For example purposes, generate random locations
  const result: SharedAstroSpot[] = [];
  
  for (let i = 0; i < 10; i++) {
    // Generate a random point within the radius
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.sqrt(Math.random()) * radiusKm;
    
    // Calculate the offset
    const latOffset = distance * Math.cos(angle) / 111.32; // 1 degree = 111.32 km
    const lonOffset = distance * Math.sin(angle) / (111.32 * Math.cos(centerLat * Math.PI / 180));
    
    // Calculate the coordinates
    const lat = centerLat + latOffset;
    const lon = centerLon + lonOffset;
    
    // Calculate actual distance
    const actualDistance = calculateDistance(centerLat, centerLon, lat, lon);
    
    // Add the location
    if (actualDistance <= radiusKm) {
      result.push({
        id: `loc-${i}`,
        name: `Location ${i}`,
        latitude: lat,
        longitude: lon,
        siqs: getRandomInt(3, 9),
        distance: actualDistance, // Calculated distance
        isDarkSkyReserve: i % 5 === 0, // 20% chance of being a dark sky reserve
        timestamp: new Date().toISOString() // Add timestamp
      });
    }
  }
  
  return result;
}

/**
 * Alias for findLocationsInArea for backward compatibility
 */
export const findLocationsWithinRadius = (
  centerLat: number,
  centerLon: number,
  radiusKm: number,
  certifiedOnly: boolean = false
): Promise<SharedAstroSpot[]> => {
  return new Promise(resolve => {
    setTimeout(() => {
      const options: LocationSearchOptions = {
        includeWater: false,
        maxResults: 30
      };
      
      const locations = findLocationsInArea(centerLat, centerLon, radiusKm, options);
      
      if (certifiedOnly) {
        const certifiedLocations = locations.filter(loc => 
          loc.isDarkSkyReserve || (loc.certification && loc.certification.length > 0)
        );
        resolve(certifiedLocations);
      } else {
        resolve(locations);
      }
    }, 300);
  });
};

/**
 * Find calculated (non-certified) locations
 */
export const findCalculatedLocations = (
  latitude: number,
  longitude: number,
  radius: number,
  allowExpansion: boolean = true,
  limit: number = 10
): Promise<SharedAstroSpot[]> => {
  return new Promise(resolve => {
    setTimeout(() => {
      const locations = findLocationsInArea(latitude, longitude, radius, {
        includeWater: false,
        maxResults: limit * 2
      });
      
      // Filter to only include non-certified locations
      const calculatedLocations = locations.filter(loc => 
        !loc.isDarkSkyReserve && (!loc.certification || loc.certification.length === 0)
      );
      
      resolve(calculatedLocations.slice(0, limit));
    }, 500);
  });
};

/**
 * Sort locations by quality and distance
 */
export const sortLocationsByQuality = (locations: SharedAstroSpot[]): SharedAstroSpot[] => {
  if (!locations || locations.length === 0) return [];
  
  // First sort certified locations to the top
  return [...locations].sort((a, b) => {
    // First prioritize certified locations
    if ((a.isDarkSkyReserve || a.certification) && !(b.isDarkSkyReserve || b.certification)) {
      return -1;
    }
    if (!(a.isDarkSkyReserve || a.certification) && (b.isDarkSkyReserve || b.certification)) {
      return 1;
    }
    
    // Then sort by SIQS
    const aSiqs = typeof a.siqs === 'number' ? a.siqs : 0;
    const bSiqs = typeof b.siqs === 'number' ? b.siqs : 0;
    
    if (aSiqs !== bSiqs) {
      return bSiqs - aSiqs;
    }
    
    // Finally sort by distance
    return (a.distance || Infinity) - (b.distance || Infinity);
  });
};

/**
 * Search for locations by name
 * @param query Search query
 * @param limit Maximum number of results
 * @returns Array of locations
 */
export function searchLocationsByName(
  query: string,
  limit: number = 5
): Promise<SharedAstroSpot[]> {
  return new Promise(resolve => {
    setTimeout(() => {
      const locations: SharedAstroSpot[] = [];
      
      // Example locations
      if (query.toLowerCase().includes('park')) {
        locations.push({
          id: 'park1',
          name: 'National Park',
          latitude: 37.7749,
          longitude: -122.4194,
          siqs: 7.8,
          isDarkSkyReserve: true,
          timestamp: new Date().toISOString()
        });
      }
      
      // Add more mock results
      for (let i = 0; i < 3; i++) {
        const nameWithQuery = `${query} Point ${i}`;
        locations.push({
          id: `loc-${nameWithQuery.replace(/\s/g, '-').toLowerCase()}`,
          name: nameWithQuery,
          latitude: 37.7749 + (Math.random() * 0.1),
          longitude: -122.4194 + (Math.random() * 0.1),
          siqs: getRandomInt(3, 9),
          isDarkSkyReserve: i === 0,
          timestamp: new Date().toISOString()
        });
      }
      
      resolve(locations.slice(0, limit));
    }, 300);
  });
}

/**
 * Export addLocationToStore for usePhotoPointsMap
 */
export const addLocationToStore = (location: SharedAstroSpot): void => {
  try {
    const key = `location_${location.id}`;
    const locationData = JSON.stringify(location);
    localStorage.setItem(key, locationData);
  } catch (error) {
    console.error("Error storing location:", error);
  }
};

/**
 * Find certified locations (Dark Sky Reserves, etc.)
 */
export const findCertifiedLocations = async (
  latitude: number,
  longitude: number,
  radius: number = 10000 // Large default radius for certified locations
): Promise<SharedAstroSpot[]> => {
  return findLocationsWithinRadius(latitude, longitude, radius, true);
};
