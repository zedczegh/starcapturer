
/**
 * Real-time SIQS location update service
 * IMPORTANT: This file contains critical functionality for updating location data with real-time SIQS.
 * Any changes should be carefully tested to avoid breaking the application.
 */
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { calculateRealTimeSiqs, batchCalculateSiqs } from "../realTimeSiqsService";
import { hasValidCoordinates } from "@/utils/locationValidator";

// Cache for location SIQS data to avoid redundant calculations
const locationCache = new Map<string, {
  location: SharedAstroSpot;
  timestamp: number;
}>();

// Cache duration constants
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

/**
 * Update locations with real-time SIQS information
 * @param locations Array of locations to update
 * @param userLocation Current user location
 * @param searchRadius Search radius in km
 * @param activeView Current active view mode
 * @returns Promise resolving to updated locations array
 */
export async function updateLocationsWithRealTimeSiqs(
  locations: SharedAstroSpot[],
  userLocation: { latitude: number; longitude: number } | null,
  searchRadius: number,
  activeView: 'certified' | 'calculated'
): Promise<SharedAstroSpot[]> {
  if (!locations || !locations.length) {
    console.log("No locations provided for SIQS update");
    return [];
  }
  
  console.log(`Updating SIQS for ${locations.length} locations (${activeView} view)`);
  
  // Validate and filter locations
  const validLocations = locations.filter(loc => 
    loc && hasValidCoordinates(loc)
  );
  
  // Check cache for recent calculations to avoid redundant API calls
  const now = Date.now();
  const cachedLocations: SharedAstroSpot[] = [];
  const locationsToUpdate: SharedAstroSpot[] = [];
  
  validLocations.forEach(location => {
    if (!location.latitude || !location.longitude) return;
    
    // Generate cache key
    const cacheKey = `${location.latitude.toFixed(4)}-${location.longitude.toFixed(4)}-${activeView}`;
    const cachedData = locationCache.get(cacheKey);
    
    if (cachedData && (now - cachedData.timestamp < CACHE_DURATION)) {
      console.log(`Using cached SIQS for ${location.name || 'location'}: ${cachedData.location.siqs}`);
      cachedLocations.push(cachedData.location);
    } else {
      locationsToUpdate.push(location);
    }
  });
  
  // If all locations are cached, return immediately
  if (locationsToUpdate.length === 0) {
    return cachedLocations;
  }
  
  try {
    // Batch calculate SIQS for locations that need updating
    const maxParallelRequests = 5;
    const updatedLocations = await batchCalculateSiqs(locationsToUpdate, maxParallelRequests);
    
    // Update cache with new data
    updatedLocations.forEach(location => {
      if (!location.latitude || !location.longitude) return;
      
      const cacheKey = `${location.latitude.toFixed(4)}-${location.longitude.toFixed(4)}-${activeView}`;
      locationCache.set(cacheKey, {
        location,
        timestamp: now
      });
    });
    
    // Combine cached and newly updated locations
    return [...cachedLocations, ...updatedLocations];
  } catch (error) {
    console.error("Error updating locations with real-time SIQS:", error);
    return cachedLocations; // Return cached locations on error
  }
}

/**
 * Clear the location cache
 */
export function clearLocationCache(): void {
  const size = locationCache.size;
  locationCache.clear();
  console.log(`Location cache cleared (${size} entries removed)`);
}

/**
 * Get the current cache size
 * @returns Number of cached entries
 */
export function getLocationCacheSize(): number {
  return locationCache.size;
}
