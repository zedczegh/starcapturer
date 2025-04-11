
import { calculateRealTimeSiqs } from '../realTimeSiqsService';
import { SharedAstroSpot } from '@/lib/siqs/types';

// Manage a cache of locations to avoid redundant API calls
const locationCache = new Map<string, {
  siqs: number;
  siqsResult?: any;
  timestamp: number;
}>();

// Cache invalidation timeout - 30 minutes
const CACHE_TIMEOUT = 30 * 60 * 1000;

/**
 * Clear the location cache - useful when changing search radius or location dramatically
 */
export function clearLocationCache() {
  console.log("Clearing location SIQS cache");
  locationCache.clear();
}

/**
 * Update an array of locations with real-time SIQS values
 * @param locations Array of locations to update
 * @returns Promise resolving to locations with updated SIQS
 */
export async function updateLocationsWithRealTimeSiqs(
  locations: SharedAstroSpot[]
): Promise<SharedAstroSpot[]> {
  if (!locations || !Array.isArray(locations) || locations.length === 0) {
    console.log("No locations provided to updateLocationsWithRealTimeSiqs");
    return [];
  }
  
  console.log(`Updating ${locations.length} locations with real-time SIQS`);
  
  // Filter out invalid locations
  const validLocations = locations.filter(loc => 
    loc && typeof loc.latitude === 'number' && typeof loc.longitude === 'number'
  );

  // Clone locations to avoid mutating the original
  const updatedLocations = [...validLocations];
  
  // Prioritize dark sky reserves and certified locations
  const prioritizedLocations = [...updatedLocations].sort((a, b) => {
    if (a.isDarkSkyReserve && !b.isDarkSkyReserve) return -1;
    if (!a.isDarkSkyReserve && b.isDarkSkyReserve) return 1;
    if (a.certification && !b.certification) return -1;
    if (!a.certification && b.certification) return 1;
    return 0;
  });
  
  // Update each location with real-time SIQS
  const now = Date.now();
  const results = await Promise.all(
    prioritizedLocations.map(async (location) => {
      try {
        if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
          return location;
        }
        
        // Generate cache key
        const cacheKey = `${location.latitude.toFixed(4)}-${location.longitude.toFixed(4)}`;
        
        // Check cache first
        const cached = locationCache.get(cacheKey);
        if (cached && (now - cached.timestamp < CACHE_TIMEOUT)) {
          console.log(`Using cached SIQS ${cached.siqs.toFixed(1)} for ${cacheKey}`);
          return {
            ...location,
            siqs: cached.siqs,
            siqsResult: cached.siqsResult || { 
              score: cached.siqs, 
              isNighttimeCalculation: true,
              isViable: cached.siqs >= 5.0
            }
          };
        }
        
        // Use consistent Bortle scale
        const bortleScale = location.bortleScale || 4;
        
        console.log(`Calculating real-time SIQS for ${cacheKey}, Bortle: ${bortleScale}`);
        
        // Calculate real-time SIQS with nighttime emphasis
        const siqsResult = await calculateRealTimeSiqs(
          location.latitude, 
          location.longitude, 
          bortleScale
        );
        
        // Cache the result
        locationCache.set(cacheKey, {
          siqs: siqsResult.siqs,
          siqsResult: {
            score: siqsResult.siqs,
            isViable: siqsResult.isViable,
            factors: siqsResult.factors || [],
            isNighttimeCalculation: true
          },
          timestamp: now
        });
        
        // Return updated location
        return {
          ...location,
          siqs: siqsResult.siqs,
          siqsResult: {
            score: siqsResult.siqs,
            isViable: siqsResult.isViable,
            factors: siqsResult.factors || [],
            isNighttimeCalculation: true
          }
        };
      } catch (error) {
        console.error(`Error updating SIQS for location ${location.id || 'unknown'}:`, error);
        return location;
      }
    })
  );
  
  return results;
}
