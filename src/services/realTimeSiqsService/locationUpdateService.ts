
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { calculateRealTimeSiqs, batchCalculateSiqs } from "./index";
import { toast } from "sonner";

// In-memory cache for location coordinates and results
interface LocationCache {
  timestamp: number;
  locations: SharedAstroSpot[];
}

// Global cache with timeout - reduced from 5 minutes to 2 minutes for more freshness
const locationCache: Record<string, LocationCache> = {};
const CACHE_TIMEOUT = 2 * 60 * 1000; // 2 minutes

/**
 * Generate a cache key based on user location and radius
 */
const generateCacheKey = (
  latitude: number,
  longitude: number,
  radius: number,
  type: 'certified' | 'calculated'
): string => {
  // More precise lat/lng for better cache differentiation
  const lat = latitude.toFixed(3);
  const lng = longitude.toFixed(3);
  return `${type}-${lat}-${lng}-${radius}`;
};

/**
 * Check if cache is valid
 */
const isCacheValid = (cacheKey: string): boolean => {
  const cache = locationCache[cacheKey];
  
  if (!cache) return false;
  
  const now = Date.now();
  return now - cache.timestamp < CACHE_TIMEOUT;
};

/**
 * Update locations with current SIQS values
 */
export const updateLocationsWithRealTimeSiqs = async (
  locations: SharedAstroSpot[],
  userLocation: { latitude: number; longitude: number },
  radius: number,
  type: 'certified' | 'calculated'
): Promise<SharedAstroSpot[]> => {
  if (!locations || locations.length === 0 || !userLocation) {
    return locations;
  }
  
  // Check cache first
  const cacheKey = generateCacheKey(
    userLocation.latitude, 
    userLocation.longitude, 
    radius,
    type
  );
  
  if (isCacheValid(cacheKey)) {
    console.log(`Using cached locations for ${type} around ${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}`);
    return locationCache[cacheKey].locations;
  }
  
  try {
    console.log(`Updating ${locations.length} ${type} locations with real-time SIQS data`);
    
    // For certified locations, batch process in parallel for efficiency
    if (type === 'certified' || locations.length > 10) {
      // Use smaller batch size (3) for more consistent processing
      const updatedLocations = await batchCalculateSiqs(locations, 3);
      
      // Save to cache
      locationCache[cacheKey] = {
        timestamp: Date.now(),
        locations: updatedLocations
      };
      
      return updatedLocations;
    } 
    // For calculated locations or small sets, process one by one
    else {
      const updatedLocations = await Promise.all(
        locations.map(async (location) => {
          if (!location.latitude || !location.longitude) return location;
          
          try {
            const result = await calculateRealTimeSiqs(
              location.latitude,
              location.longitude,
              location.bortleScale || 5
            );
            
            return {
              ...location,
              siqs: result.siqs,
              isViable: result.isViable,
              siqsFactors: result.factors
            };
          } catch (error) {
            console.error(`Error calculating SIQS for location ${location.name}:`, error);
            return location;
          }
        })
      );
      
      // Save to cache
      locationCache[cacheKey] = {
        timestamp: Date.now(),
        locations: updatedLocations
      };
      
      return updatedLocations;
    }
  } catch (error) {
    console.error("Error updating locations with real-time SIQS:", error);
    return locations;
  }
};

/**
 * Clear the location cache
 */
export const clearLocationCache = () => {
  const cacheKeys = Object.keys(locationCache);
  const cacheCount = cacheKeys.length;
  
  cacheKeys.forEach(key => {
    delete locationCache[key];
  });
  
  console.log(`Location cache cleared (${cacheCount} entries)`);
  toast.success("Location data refreshed");
};

/**
 * Get the number of locations in cache
 */
export const getLocationCacheCount = (): number => {
  return Object.keys(locationCache).length;
};

/**
 * Check if locations need updating based on user movement
 */
export const shouldUpdateLocations = (
  prevLocation: { latitude: number; longitude: number } | null,
  newLocation: { latitude: number; longitude: number } | null
): boolean => {
  if (!prevLocation || !newLocation) return true;
  
  // Calculate approximate distance
  const latDiff = Math.abs(prevLocation.latitude - newLocation.latitude);
  const lngDiff = Math.abs(prevLocation.longitude - newLocation.longitude);
  
  // If moved more than ~2km, update locations (more sensitive than before)
  // Roughly 0.02 degrees latitude = ~2.2km
  return latDiff > 0.02 || lngDiff > 0.02;
};

/**
 * Force update all location data regardless of cache status
 */
export const forceUpdateAllLocations = async (
  locations: SharedAstroSpot[],
  userLocation: { latitude: number; longitude: number } | null
): Promise<SharedAstroSpot[]> => {
  if (!locations || locations.length === 0 || !userLocation) {
    return locations;
  }
  
  console.log(`Force updating ${locations.length} locations with fresh SIQS data`);
  
  try {
    // Clear existing cache first
    clearLocationCache();
    
    // Update all locations with fresh data
    const updatedLocations = await batchCalculateSiqs(locations, 3);
    return updatedLocations;
  } catch (error) {
    console.error("Error force updating locations:", error);
    return locations;
  }
};
