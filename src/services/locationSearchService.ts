
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { calculateDistance } from "@/utils/geoUtils";
import { locationDatabase } from "@/data/locationDatabase";
import { isWaterLocation } from "@/utils/locationValidator";
import { prefetchLocationData } from "@/lib/queryPrefetcher";
import { queryClient } from "@/main";

// In-memory cache for frequently accessed locations
const locationCache = new Map<string, SharedAstroSpot[]>();

/**
 * Find certified dark sky locations within a given radius
 */
export const findCertifiedLocations = async (
  latitude: number,
  longitude: number,
  radius: number = 1000,
  limit: number = 100
): Promise<SharedAstroSpot[]> => {
  // Generate cache key based on search parameters
  const cacheKey = `certified-${latitude.toFixed(2)}-${longitude.toFixed(2)}-${radius}`;
  
  // Return from cache if available
  if (locationCache.has(cacheKey)) {
    return locationCache.get(cacheKey) || [];
  }
  
  try {
    // Filter locations from database that are certified
    const certifiedLocations = locationDatabase
      .filter(location => location.certification || location.isDarkSkyReserve)
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
        // Only include locations within radius or certified locations
        return location.distance <= radius || 
               location.isDarkSkyReserve || 
               location.certification;
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);
    
    // Cache results for future use
    locationCache.set(cacheKey, certifiedLocations);
    
    // Prefetch location data for the first few locations
    certifiedLocations.slice(0, 5).forEach(location => {
      if (location.latitude && location.longitude) {
        prefetchLocationData(queryClient, location.latitude, location.longitude);
      }
    });
    
    return certifiedLocations;
  } catch (error) {
    console.error("Error finding certified locations:", error);
    return [];
  }
};

/**
 * Find calculated locations based on quality rather than certification
 */
export const findCalculatedLocations = async (
  latitude: number,
  longitude: number, 
  radius: number = 100,
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
        location.distance <= radius && 
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
