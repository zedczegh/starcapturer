
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { calculateDistance } from "@/utils/geoUtils";
import { locationDatabase } from "@/data/locationDatabase";
import { isWaterLocation } from "@/utils/locationValidator";
import { prefetchLocationData } from "@/lib/queryPrefetcher";

// In-memory cache for frequently accessed locations
const locationCache = new Map<string, SharedAstroSpot[]>();

/**
 * Find locations within a given radius
 */
export const findLocationsWithinRadius = async (
  latitude: number,
  longitude: number,
  radius: number = 1000,
  onlyCertified: boolean = false,
  limit: number = 100
): Promise<SharedAstroSpot[]> => {
  // Generate cache key based on search parameters
  const cacheKey = `${onlyCertified ? 'certified' : 'all'}-${latitude.toFixed(2)}-${longitude.toFixed(2)}-${radius}`;
  
  // Return from cache if available
  if (locationCache.has(cacheKey)) {
    return locationCache.get(cacheKey) || [];
  }
  
  try {
    // Filter locations from database
    const filteredLocations = locationDatabase
      .filter(location => {
        // Apply certified filter if needed
        if (onlyCertified && !location.certification && !location.isDarkSkyReserve) {
          return false;
        }
        return true;
      })
      .map(location => {
        const [locLat, locLng] = location.coordinates;
        const distance = calculateDistance(latitude, longitude, locLat, locLng);
        
        // Convert to SharedAstroSpot format
        return {
          id: `loc-${locLat}-${locLng}`,
          name: location.name,
          chineseName: location.chineseName,
          latitude: locLat,
          longitude: locLng,
          bortleScale: location.bortleScale,
          certification: location.certification,
          isDarkSkyReserve: location.isDarkSkyReserve,
          distance: distance,
          timestamp: new Date().toISOString(),
          radius: location.radius || 0,
          type: location.type || 'dark-site'
        } as SharedAstroSpot;
      })
      .filter(location => {
        // For certified locations, include them regardless of distance
        if (location.isDarkSkyReserve || location.certification) {
          return true;
        }
        
        // Check if location is on water and filter out if it is
        if (isWaterLocation(location.latitude, location.longitude)) {
          return false;
        }
        
        // Only include regular locations within radius
        return location.distance <= radius;
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);
    
    // Cache results for future use
    locationCache.set(cacheKey, filteredLocations);
    
    // Prefetch location data for the first few locations
    filteredLocations.slice(0, 5).forEach(location => {
      if (location.latitude && location.longitude) {
        prefetchLocationData(location.latitude, location.longitude);
      }
    });
    
    return filteredLocations;
  } catch (error) {
    console.error("Error finding locations:", error);
    return [];
  }
};

/**
 * Sort locations by quality factors
 */
export const sortLocationsByQuality = (locations: SharedAstroSpot[]): SharedAstroSpot[] => {
  if (!locations || locations.length === 0) {
    return [];
  }
  
  return [...locations].sort((a, b) => {
    // First prioritize certified locations
    if ((a.isDarkSkyReserve || a.certification) && !(b.isDarkSkyReserve || b.certification)) {
      return -1;
    }
    if (!(a.isDarkSkyReserve || a.certification) && (b.isDarkSkyReserve || b.certification)) {
      return 1;
    }
    
    // Then sort by SIQS score
    if ((a.siqs || 0) !== (b.siqs || 0)) {
      return (b.siqs || 0) - (a.siqs || 0);
    }
    
    // Then sort by bortle scale (lower is better)
    if ((a.bortleScale || 0) !== (b.bortleScale || 0)) {
      return (a.bortleScale || 0) - (b.bortleScale || 0);
    }
    
    // Finally sort by distance
    return (a.distance || Infinity) - (b.distance || Infinity);
  });
};

/**
 * Find certified locations within a given radius
 */
export const findCertifiedLocations = async (
  latitude: number,
  longitude: number,
  radius: number = 1000,
  limit: number = 100
): Promise<SharedAstroSpot[]> => {
  return findLocationsWithinRadius(latitude, longitude, radius, true, limit);
};

/**
 * Find calculated locations based on quality rather than certification
 */
export const findCalculatedLocations = async (
  latitude: number,
  longitude: number, 
  radius: number = 100,
  expandRadius: boolean = true,
  limit: number = 50,
  minQuality: number = 50
): Promise<SharedAstroSpot[]> => {
  // Implementation for calculated locations
  // This would use external APIs or algorithms to find good spots
  
  // For now, return a subset of existing locations that aren't certified
  try {
    const nonCertifiedLocations = locationDatabase
      .filter(location => !location.certification && !location.isDarkSkyReserve)
      .map(location => {
        const [locLat, locLng] = location.coordinates;
        const distance = calculateDistance(latitude, longitude, locLat, locLng);
        
        // Filter out water locations
        if (isWaterLocation(locLat, locLng)) {
          return null;
        }
        
        // Calculate a dummy quality score based on Bortle scale
        // Lower Bortle = better sky = higher quality
        const qualityScore = Math.max(0, 100 - (location.bortleScale * 10));
        
        // Convert to SharedAstroSpot format
        return {
          id: `calc-${locLat}-${locLng}`,
          name: location.name,
          chineseName: location.chineseName,
          latitude: locLat,
          longitude: locLng,
          bortleScale: location.bortleScale,
          distance: distance,
          siqs: qualityScore,
          timestamp: new Date().toISOString()
        } as SharedAstroSpot;
      })
      .filter(location => 
        location !== null && 
        (expandRadius ? true : location.distance <= radius) && 
        (location.siqs || 0) >= minQuality
      )
      .sort((a, b) => a!.distance - b!.distance)
      .slice(0, limit);
    
    return nonCertifiedLocations.filter(loc => loc !== null) as SharedAstroSpot[];
  } catch (error) {
    console.error("Error finding calculated locations:", error);
    return [];
  }
};

// Clear the location cache
export const clearLocationCache = () => {
  locationCache.clear();
  console.log("Location cache cleared");
};
